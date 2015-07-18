"use strict";

var assert = require("assert");
var CedalionInterface = require("../cedalionInterface.js");
var Nodalion = require("../nodalion.js");

var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

describe('Nodalion', function(){
    var cedalionInterface = new CedalionInterface('/tmp/ced.log');
    var nodalion, impred, builtin, bootstrap;
    beforeEach(function() {
	nodalion = new Nodalion(cedalionInterface);
	impred = nodalion.namespace('/impred', ['pred', 'someException']);
	builtin = nodalion.namespace('builtin', ['succ', 'throw']);
	bootstrap = nodalion.namespace('/bootstrap', ['listMember']);
    });

    describe('.namespace(name, concepts)', function(){
	it('should create a namespace object with the given name and concepts', function(){
	    var foo = nodalion.namespace('foo', ['bar']);
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
    });
});

