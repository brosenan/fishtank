"use strict";
var assert = require('assert');
var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var Redis = require('ioredis');
var nodalionRedis = require('../redis.js');
var nodalion = require('../nodalion.js');
var ns = nodalion.namespace('/nodalion', ['get', 'set']);

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
	    nodalionRedis.db({ showFriendlyErrorStack: true,
			       port: 6379,
			       host: '127.0.0.1'});
	});
    });

    describe('/nodalion:set(key, value) => void', function(){
	it('should set a value', $T(function*(){
	    yield doTask(ns.set('a', 'A'), $R());
	    assert.equal(yield doTask(ns.get('a'), $R()), 'A');
	}));
    });

});
