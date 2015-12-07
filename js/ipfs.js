"use strict";
var ipfs = require('ipfs-client');
var temp = require('temp');
var fs = require('fs');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var Nodalion = require('./nodalion.js');
var ns = Nodalion.namespace('/nodalion', []);

ns._register('ipfsAdd', (Str) => (nodalion, cb) => {
    var stream = {pipe: (outStream) => {
	outStream.write(Str);
	outStream.end();
    }};
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
    var path = temp.path();
    var writer = fs.createWriteStream(path);
    var cat = ipfs.cat(Hash);
    cat.pipe(writer);
    yield cat.on('end', $RR());
    return path;
}));
