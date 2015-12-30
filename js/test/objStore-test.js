"use strict";
var assert = require('assert');
var fs = require('fs');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };
var objStore = require('../objStore.js');

var Nodalion = require('../nodalion.js');
require('../objStore.js');

var ns = Nodalion.namespace('/nodalion', ['objStoreAdd', 'objStoreCat', 'objStoreToTmp']);
var nodalion = new Nodalion('/tmp/objStore.log');

var doTask = function(task, cb) {
    task.meaning()(nodalion, cb);
};

describe('/nodalion#objStoreAdd(Str)', function(){
    it('should turn a string into a hash', $T(function*(){
	var hash = yield doTask(ns.objStoreAdd("Hello, World\n"), $R());
	var str = yield objStore.getString(hash, $R());
	assert.equal(str, 'Hello, World\n');
    }));
});

describe('/nodalion#objStoreCat(Hash)', function(){
    it('should turn a hash into a string', $T(function*(){
	var hash = yield objStore.addString("Hello, World\n", $R());
	var str = yield doTask(ns.objStoreCat(hash), $R());
	assert.equal(str, "Hello, World\n");
    }));
});

describe('/nodalion#objStoreToTmp(Hash)', function(){
    it('should create a temporary file with the content under Hash and return its path', $T(function*(){
	var hash = yield objStore.addString("Hello, World\n", $R());
	var path = yield doTask(ns.objStoreToTmp(hash), $R());
	var reader = fs.createReadStream(path);
	var result = '';
	reader.setEncoding('utf-8');
	reader.on('data', data => { result += data; });
	yield reader.on('end', $RR());
	assert.equal(result, 'Hello, World\n');
    }));

});
