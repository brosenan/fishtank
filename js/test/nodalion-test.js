"use strict";

var assert = require("assert");
var Nodalion = require("../nodalion.js");

var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var impred = Nodalion.namespace('/impred', ['pred', 'someException', 'greet']);
var builtin = Nodalion.namespace('builtin', ['succ', 'throw']);
var bootstrap = Nodalion.namespace('/bootstrap', ['listMember']);

describe('Nodalion', function(){
    var nodalion;
    nodalion = new Nodalion('/tmp/ced.log');

    describe('.namespace(name, concepts)', function(){
	it('should create a namespace object with the given name and concepts', function(){
	    var foo = Nodalion.namespace('foo', ['bar']);
	    assert.equal(foo.bar(1, 2, 3).toString(), "'foo#bar'(1,2,3)");
	});
    });


    describe('.findAll(res, impred, cb(err, results))', function(){
	it('should call the callback with all results', $T(function*(){
	    var X = {var:'X'};
	    var T = {var:'T'};
	    var res = yield nodalion.findAll(X, impred.pred(bootstrap.listMember(X, T, [1, 2, 3])), $R());
	    assert.deepEqual(res, [1, 2, 3]);
	}));
	it('should call the callback only once', function(done){
	    var X = {var:'X'};
	    nodalion.findAll(X, impred.pred(builtin.throw(impred.someException())), function() {
		done();
	    });
	});
	it('should propagate exceptions properly', $T(function*(){
	    var X = {var:'X'};
	    try {
		yield nodalion.findAll(X, impred.pred(builtin.throw(impred.someException())), $R());
		assert(false, 'previous statement should have failed');
	    } catch(e) {
		assert.equal(e.message, impred.someException().toString());
	    }
	}));
	it('should follow continuations', $T(function*(){
	    impred._register('userInput', function() {
		return function(nodalion, cb) {
		    return cb(undefined, 'nodalion');
		};
	    });
	    var X = {var:'X'};
	    var res = yield nodalion.findAll(X, impred.greet(X), $R());
	    assert.deepEqual(res, ["Hello, nodalion"]);
	}));
	it('should pass the ndalion instance to the task', $T(function*(){
	    impred._register('userInput', function() {
		return function(nod, cb) {
		    assert(nod instanceof Nodalion, nod + " instanceof Nodalion");
		    return cb(undefined, 'nodalion');
		};
	    });
	    var X = {var:'X'};
	    var res = yield nodalion.findAll(X, impred.greet(X), $R());
	}));
    });
});

