"use strict";
var assert = require('assert');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var Nodalion = require('../nodalion.js');
require('../ipfs.js');

var ns = Nodalion.namespace('/nodalion', ['ipfsAdd']);
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
