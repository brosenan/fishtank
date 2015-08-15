"use strict";
var $S = require('suspend'), $R = $S.resume;
var Redis = require('ioredis');

var nodalion = require('./nodalion.js');

var ns = nodalion.namespace('/nodalion', ['void']);

var redis;

exports.db = function(options) {
    redis = new Redis(options);
};

ns._register('kvsSet', function(key, value) {
    return $S.async(function*() {
	redis.set(key, value);
	return ns.void();
    });
});

ns._register('kvsSetWithTTL', function(key, value, ttl) {
    function trans(cb) {
	redis.multi()
	    .set(key, value)
	    .expire(key, ttl)
	    .exec(function(err) {
		cb(err);
	    });
    }
    return $S.async(function*() {
	yield trans($R());
	return ns.void();
    });
});

ns._register('kvsGet', function(key) {
    return $S.async(function*() {
	return (yield redis.get(key)) || '';
    });
});
