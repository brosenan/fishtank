"use strict";
var assert = require('assert');
var fs = require('fs');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };
var ipfs = require('../fake-ipfs.js');

var Nodalion = require('../nodalion.js');
require('../ipfs.js');

var ns = Nodalion.namespace('/nodalion', ['ipfsAdd', 'ipfsCat', 'ipfsToTmp']);
var nodalion = new Nodalion('/tmp/ipfs.log');

var doTask = function(task, cb) {
    task.meaning()(nodalion, cb);
};

describe('/nodalion#ipfsAdd(Str)', function(){
    it('should turn a string into a hash', $T(function*(){
	var hash = yield doTask(ns.ipfsAdd("Hello, World\n"), $R());
	var str = yield ipfs.getString(hash, $R());
	assert.equal(str, 'Hello, World\n');
    }));
});

describe('/nodalion#ipfsCat(Hash)', function(){
    it('should turn a hash into a string', $T(function*(){
	var hash = yield ipfs.addString("Hello, World\n", $R());
	var str = yield doTask(ns.ipfsCat(hash), $R());
	assert.equal(str, "Hello, World\n");
    }));
});

describe('/nodalion#ipfsToTmp(Hash)', function(){
    it('should create a temporary file with the content under Hash and return its path', $T(function*(){
	var hash = yield ipfs.addString("Hello, World\n", $R());
	var path = yield doTask(ns.ipfsToTmp(hash), $R());
	var reader = fs.createReadStream(path);
	var result = '';
	reader.setEncoding('utf-8');
	reader.on('data', data => { result += data; });
	yield reader.on('end', $RR());
	assert.equal(result, 'Hello, World\n');
    }));

});
