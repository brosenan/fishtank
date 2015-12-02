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
