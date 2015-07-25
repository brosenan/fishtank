"use strict";
var assert = require('assert');
var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var Nodalion = require('../nodalion.js');
var ns = Nodalion.namespace('/impred', ['testLocalStore']);

var nodalion = new Nodalion('/tmp/impred-ced.log');

describe('impred', function(){
    describe('local storage', function(){
	it('should allow storing and fetching local state', $T(function*(){
	    var X = {var:'X'};
	    var result = yield nodalion.findAll(X, ns.testLocalStore(X), $R());
	    assert.deepEqual(result, ['bar']);
	}));

    });
});
