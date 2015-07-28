"use strict";
var assert = require('assert');
var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var Nodalion = require('../nodalion.js');
var ns = Nodalion.namespace('/impred', ['testLocalStore', 'localStr', 'testNow', 'testUUID']);

var nodalion = new Nodalion('/tmp/impred-ced.log');

describe('impred', function(){
    describe('local storage', function(){
	it('should allow storing and fetching local state', $T(function*(){
	    var X = {var:'X'};
	    var result = yield nodalion.findAll(X, ns.testLocalStore(X), $R());
	    assert.deepEqual(result, [ns.localStr('bar')]);
	}));
    });
    describe('now', function(){
	it('should return the current time', $T(function*(){
	    var X = {var:'X'};
	    var result = yield nodalion.findAll(X, ns.testNow(X), $R());
	    var list = result[0];
	    assert(list[0] < list[1], list[0] + ' < ' + list[1]);
	    assert(list[1] < list[2], list[1] + ' < ' + list[2]);
	    assert(list[2] - list[0] < 1, (list[2] - list[0]) + ' < 1');
	}));
    });
    describe('uuid', function(){
	it('should return a unique ID each time it is called', $T(function*(){
	    var X = {var:'X'};
	    var result = yield nodalion.findAll(X, ns.testUUID(X), $R());
	    var list = result[0];
	    assert.notEqual(list[0], list[1]);
	    assert.notEqual(list[2], list[1]);
	    list.forEach(function(id) {
		// Should be at least 128 bits
		assert(id.length * 6 > 128, (id.length * 6) + ' > 128');
	    });
	}));
    });

});
