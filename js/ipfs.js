"use strict";
var ipfs = require('./fake-ipfs.js');
var temp = require('temp');
var fs = require('fs');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };
var EventEmitter = require('events').EventEmitter;

var Nodalion = require('./nodalion.js');
var ns = Nodalion.namespace('/nodalion', []);

ns._register('ipfsAdd', (Str) => (nodalion, cb) => {
    var stream = new EventEmitter();
    stream.pipe = (outStream) => {
	outStream.write(Str);
	outStream.end();
	stream.emit('end');
    }
    ipfs.add(stream, cb);
});

ns._register('ipfsCat', (Hash) => (nodalion, cb) => {
    var stream = ipfs.cat(Hash);
    var str = '';
    stream.setEncoding('utf-8');
    stream.on('data', data => { str += data; });
    stream.on('end', () => cb(undefined, str));
    stream.on('error', cb);
});

ns._register('ipfsToTmp', (Hash) => $S.async(function*(nodalion) {
    if(typeof Hash !== 'string') throw Error('Hash must be a string.  Got: ' + JSON.stringify(Hash));
    var path = temp.path();
    var writer = fs.createWriteStream(path);
    var cat = ipfs.cat(Hash);
    cat.pipe(writer);
    yield cat.on('end', $RR());
    return path;
}));
