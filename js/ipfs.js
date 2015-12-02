"use strict";
var ipfs = require('ipfs-client');

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
