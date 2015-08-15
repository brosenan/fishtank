"use strict";
var assert = require('assert');
var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var Redis = require('ioredis');
var nodalionRedis = require('../redis.js');
var nodalion = require('../nodalion.js');
var ns = nodalion.namespace('/nodalion', ['kvsGet', 'kvsSet', 'kvsSetWithTTL']);

var cedParser = require('../cedParser.js');

var parser = new cedParser.CedParser();

var doTask = function(term, cb) {
    var task = parser.parse(term.toString());
    task(cb);
};

describe('ioredis', function(){
    it('should set and then get a value', $T(function*(){
	var redis = new Redis({ showFriendlyErrorStack: true });
	redis.set('foo', 'bar');
	function myGet(key, cb) {
	    redis.get(key, function(err, value) {
		cb(err, value);
	    });
	}
	var res = yield myGet('foo', $R());
	assert.equal(res, 'bar');
    }));
});


describe('nodalionRedis', function(){
    describe('.db(options)', function(){
	it('should define a database based on ioredis options', function(){
	    nodalionRedis.db({showFriendlyErrorStack: true,
			      port: 6379,
			      host: '127.0.0.1'});
	});
    });

    describe('/nodalion:kvsSet(key, value) => void', function(){
	it('should set a value', $T(function*(){
	    yield doTask(ns.kvsSet('a', 'A'), $R());
	    assert.equal(yield doTask(ns.kvsGet('a'), $R()), 'A');
	}));
    });

    describe('/nodalion:kvsGet(key) => value', function(){
	it('should return a value', $T(function*(){
	    yield doTask(ns.kvsSet('b', 'B'), $R());
	    assert.equal(yield doTask(ns.kvsGet('b'), $R()), 'B');
	}));
	it('should return an empty string if the key does not exist', $T(function*(){
	    assert.equal(yield doTask(ns.kvsGet('a-key-that-does-not-exist'), $R()), '');
	}));

    });

    describe('/nodalion:kvsSetWithTTL(key, value, ttl) => void', function(){
	it('should set a value', $T(function*(){
	    yield doTask(ns.kvsSetWithTTL('c', 'C', 1), $R());
	    assert.equal(yield doTask(ns.kvsGet('c'), $R()), 'C');
	}));
	// We skip the following test because it takes > 1 second due to Redis's limitation
	// on TTLs.
	it.skip('should expire the value after TTL seconds', $T(function*(){
	    yield doTask(ns.kvsSetWithTTL('d', 'D', 1), $R());
	    yield setTimeout($R(), 1200);
	    assert.equal(yield doTask(ns.kvsGet('d'), $R()), '');
	}));
    });

});
