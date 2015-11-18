"use strict";
var assert = require('assert');
var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var Nodalion = require('../js/nodalion.js');
var nodalionMongo = require('../js/nodalionMongo.js');
var workQueue = require('../js/workQueue.js');

var ns = Nodalion.namespace('/nodalion', ['defaultQueueDomain']);
nodalionMongo.db('mongodb://127.0.0.1:27017/tweetlog');

var nodalion = new Nodalion('/tmp/tweetlog.log');

workQueue.connect(nodalion, 'amqp://localhost', ns.defaultQueueDomain());

var tweetlog = Nodalion.namespace('/tweetlog', ['initialize', 'scenario', 'testTweet']);

$S.async(function*() {
    yield nodalion.findAll([], tweetlog.scenario(1), $R());
    yield nodalion.findAll([], tweetlog.initialize(), $R());
    yield setTimeout($R(), 1000);
    var result = yield nodalion.findAll({var:'X'}, tweetlog.testTweet(1, {var:'X'}), $R());
    console.log(result);
})(function(err) {if(err) {console.error(err);} console.log('done')});
