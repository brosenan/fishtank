"use strict";
var assert = require('assert');
var fs = require('fs');
var temp = require('temp');
var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var Nodalion = require('../nodalion.js');
var ns = Nodalion.namespace('/impred', ['testLocalStore', 'localStr', 'testNow', 'testUUID', 'testLocalQueue', 'testBase64Encode', 'testBase64Decode', 'testLoadNamespace']);

var nodalion = new Nodalion('/tmp/impred-ced.log');

describe('impred', function(){
    describe('local storage', function(){
	it('should allow storing and fetching local state', $T(function*(){
	    var X = {var:'X'};
	    var result = yield nodalion.findAll(X, ns.testLocalStore(X), $R());
	    assert.deepEqual(result, [ns.localStr('bar')]);
	}));
    });
    describe('local queue', function(){
	it('should allow enqueuing and dequeing data', $T(function*(){
	    var X = {var:'X'};
	    var result = yield nodalion.findAll(X, ns.testLocalQueue(1, X), $R());
	    assert.deepEqual(result, ['helloworld']);
	}));
	it('should allow checking if the queue is empty', $T(function*(){
	    var X = {var:'X'};
	    var result = yield nodalion.findAll(X, ns.testLocalQueue(2, X), $R());
	    assert.deepEqual(result, ['YNY']);
	}));

    });
    describe('now', function(){
	it('should return the current time', $T(function*(){
	    var X = {var:'X'};
	    var result = yield nodalion.findAll(X, ns.testNow(X), $R());
	    var list = result[0].meaning();
	    assert(list[0] < list[1], list[0] + ' < ' + list[1]);
	    assert(list[1] < list[2], list[1] + ' < ' + list[2]);
	    assert(list[2] - list[0] < 1, (list[2] - list[0]) + ' < 1');
	}));
    });
    describe('uuid', function(){
	it('should return a unique ID each time it is called', $T(function*(){
	    var X = {var:'X'};
	    var result = yield nodalion.findAll(X, ns.testUUID(X), $R());
	    var list = result[0].meaning();
	    assert.notEqual(list[0], list[1]);
	    assert.notEqual(list[2], list[1]);
	    list.forEach(function(id) {
		// Should be at least 128 bits
		assert(id.length * 6 > 128, (id.length * 6) + ' > 128');
	    });
	}));
    });
    describe('base64Encode(Plain)', function(){
	it('should base64-encode the given Plain text', $T(function*(){
	    var X = {var:'X'};
	    var plain = "the quick brown fox and so on and so forth....";
	    var result = yield nodalion.findAll(X, ns.testBase64Encode(plain, X), $R());
	    var enc = result[0];
	    var buf = new Buffer(Buffer.byteLength(plain));
	    buf.write(plain);
	    assert.equal(enc, buf.toString('base64'));
	}));
    });
    describe('base64Decode(Enc)', function(){
	it('should decode the given base64-encoded string', $T(function*(){
	    var X = {var:'X'};
	    var plain = "the quick brown fox and so on and so forth....";
	    var buf = new Buffer(Buffer.byteLength(plain));
	    buf.write(plain);
	    var result = yield nodalion.findAll(X, ns.testBase64Decode(buf.toString('base64'), X), $R());
	    var dec = result[0];
	    assert.equal(dec, plain);
	}));
    });
    describe('loadCedalionImage(FileName, Prep, PrepIn, PrepOut)', function(){
	it('should load clauses from the given file', $T(function*(){
	    var X = {var:'X'};
	    var content = "'/impred#foo'(1):-'builtin#true'. '/impred#foo'(2):-'builtin#true'. '/impred#foo'(3):-'builtin#true'.";
	    var file = yield temp.open({prefix: 'ced', suffix: '.pl'}, $R());
	    fs.write(file.fd, content);
	    var result = yield nodalion.findAll(X, ns.testLoadNamespace(file.path, X), $R());
	    assert.deepEqual(result, [1, 2, 3]);
	}));
	it.skip('should load containers when needed', function(done){
	    this.timeout(7000);
	    $S.async(function*() {
		var hash = "QmdHZHRfuJ2QBXfvaMr3ksh3gKyoxc15LhRhKgEKrf4wnj";
		var X = {var:'X'};
		var nns = Nodalion.namespace('/nodalion', ['testContainer']);
		var result = yield nodalion.findAll(X, nns.testContainer(hash, X), $R());
		assert.deepEqual(result, ['cloudlog']);
	    })(done);
	});
    });
});
