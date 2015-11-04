"use strict";
var assert  = require('assert');
var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var workQueue = require('../workQueue.js');
var cedParser = require('../cedParser.js');

var nodalion = require('../nodalion.js');

var parser = new cedParser.CedParser();

var ns = nodalion.namespace('/nodalion', ['enqueue']);
var example = nodalion.namespace('example', ['myQueueDomain', 'foo', 'bar', 'baz', 'bat']);
var n = new nodalion('/tmp/workQ-ced.log');

var doTask = function(term, cb) {
    var task = parser.parse(term.toString());
    task(n, cb);
};

var stored = [];
example._register('store', function(str) {
    return function(nodalion, cb) {
	stored.push(str);
	cb(undefined, str);
    };
});

describe('workQueue', function(){
    describe('.connect(nodalion, url, queueDomain)', function(){
	it('should open a connection to the broker', function(){
	    workQueue.connect(n, 'amqp://localhost', example.myQueueDomain());
	});
    });
    describe('/nodalion:enqueue(Queue, Term, Type)', function(){
	it.skip('should enqueue a term to the given work queue', $T(function*(){
	    workQueue.connect(n, 'amqp://localhost', example.myQueueDomain());
	    yield doTask(ns.enqueue("workQ", example.foo(), example.bar()), $R());
	}));
	it('should distribute work to queues', $T(function*(){
	    workQueue.connect(n, 'amqp://localhost', example.myQueueDomain());
	    stored = [];
	    yield doTask(ns.enqueue('example', "hello", {var:'T'}), $R());
	    yield doTask(ns.enqueue('example', "world", {var:'T'}), $R());
	    yield setTimeout($R(), 100);
	    assert.deepEqual(stored, ['hello', 'world']);
	}));
    });
});
