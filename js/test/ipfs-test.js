"use strict";
var assert = require('assert');
var fs = require('fs');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };

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
	assert.equal(hash, 'QmTE9Xp76E67vkYeygbKJrsVj8W2LLcyUifuMHMEkyRfUL');
    }));
});

describe('/nodalion#ipfsCat(Hash)', function(){
    it('should turn a hash into a string', $T(function*(){
	var str = yield doTask(ns.ipfsCat('QmTE9Xp76E67vkYeygbKJrsVj8W2LLcyUifuMHMEkyRfUL'), $R());
	assert.equal(str, "Hello, World\n");
    }));
});

describe('/nodalion#ipfsToTmp(Hash)', function(){
    it('should create a temporary file with the content under Hash and return its path', $T(function*(){
	var path = yield doTask(ns.ipfsToTmp('QmTE9Xp76E67vkYeygbKJrsVj8W2LLcyUifuMHMEkyRfUL'), $R());
	var reader = fs.createReadStream(path);
	var result = '';
	reader.setEncoding('utf-8');
	reader.on('data', data => { result += data; });
	yield reader.on('end', $RR());
	assert.equal(result, 'Hello, World\n');
    }));

});
