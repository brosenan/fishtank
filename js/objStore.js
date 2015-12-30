'use strict';
var temp = require('temp');
var fs = require('fs');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };
var EventEmitter = require('events').EventEmitter;

var Nodalion = require('./nodalion.js');
var ns = Nodalion.namespace('/nodalion', []);

var dataDir = '/tmp';

exports.add = function(stream, cb) {
    var hash = Math.floor(Math.random() * 1000000000) + '';
    var output = fs.createWriteStream(dataDir + '/' + hash);
    stream.on('end', () => { cb(undefined, hash); });
    output.on('error', cb);
    stream.pipe(output);
};
exports.cat = function(hash) {
    return fs.createReadStream(dataDir + '/' + hash);
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
