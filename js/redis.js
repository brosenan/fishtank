"use strict";
var $S = require('suspend'), $R = $S.resume;
var Redis = require('ioredis');

var nodalion = require('./nodalion.js');

var ns = nodalion.namespace('/nodalion', ['void']);

var redis;

exports.db = function(options) {
    redis = new Redis(options);
};

ns._register('set', function(key, value) {
    return $S.async(function*() {
	redis.set(key, value);
	return ns.void();
    });
});

ns._register('get', function(key) {
    return $S.async(function*() {
	return yield redis.get(key);
    });
});
