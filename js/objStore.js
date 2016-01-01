'use strict';
var temp = require('temp');
var fs = require('fs');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };
var EventEmitter = require('events').EventEmitter;
var crypto = require('crypto');

var Nodalion = require('./nodalion.js');
var ns = Nodalion.namespace('/nodalion', []);

var dataDir = '/tmp';
var client;
var container;

exports.configure = function(config) {
    client = require('pkgcloud').storage.createClient(config);
    container = config.container;
}

function checkClient() {
    if(!client) {
	throw new Error('Object store has not been configured');
    }
}

function writeToTmp(stream, cb) {
    var hasher = crypto.createHash('sha256');
    var tmpFile = temp.path();
    var output = fs.createWriteStream(tmpFile);
    stream.on('data', data => { hasher.update(data); });
    stream.on('end', () => { cb(undefined, {tmpFile: tmpFile,
					    hash: hasher.digest('base64').replace(/\//g, '_')}); });
    output.on('error', cb);
    stream.pipe(output);
}

exports.add = $S(function*(stream, cb) {
    checkClient();
    var res = yield writeToTmp(stream, $R());
    var stream = fs.createReadStream(res.tmpFile);
    var upStream = client.upload({
	container: container,
	remote: res.hash,
    });
    stream.pipe(upStream);
    upStream.on('error', cb);
    yield upStream.on('success', $RR());
    cb(undefined, res.hash);
    yield fs.unlink(res.tmpFile, $R());
});

exports.cat = function(hash) {
    checkClient();
    return client.download({container: container, remote: hash});
};

exports.addString = function(str, cb) {
    var stream = new EventEmitter();
    stream.pipe = file => {
	file.write(str);
	file.end();
	stream.emit('end');
    };
    exports.add(stream, cb);
};

exports.getString = function(hash, cb) {
    var str = '';
    var stream = exports.cat(hash);
    stream.on('data', data => {str += data;});
    stream.on('end', () => {cb(undefined, str);});
    stream.on('error', cb);
};

ns._register('objStoreAdd', (Str) => (nodalion, cb) => {
    var stream = new EventEmitter();
    stream.pipe = (outStream) => {
	outStream.write(Str);
	outStream.end();
	stream.emit('end');
    }
    exports.add(stream, cb);
});

ns._register('objStoreCat', (Hash) => (nodalion, cb) => {
    var stream = exports.cat(Hash);
    var str = '';
    stream.setEncoding('utf-8');
    stream.on('data', data => { str += data; });
    stream.on('end', () => cb(undefined, str));
    stream.on('error', cb);
});

ns._register('objStoreToTmp', (Hash) => $S.async(function*(nodalion) {
    if(typeof Hash !== 'string') throw Error('Hash must be a string.  Got: ' + JSON.stringify(Hash));
    var path = temp.path();
    var writer = fs.createWriteStream(path);
    var cat = exports.cat(Hash);
    cat.pipe(writer);
    yield cat.on('end', $RR());
    return path;
}));
