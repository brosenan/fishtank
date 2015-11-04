"use strict";
var assert  = require('assert');
var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var workQueue = require('../workQueue.js');
var cedParser = require('../cedParser.js');

var nodalion = require('../nodalion.js');

var parser = new cedParser.CedParser();

var ns = nodalion.namespace('/nodalion', ['enqueue', 'forAll', 'par']);
var bs = nodalion.namespace('/bootstrap', ['listMember', 'pair']);
var impred = nodalion.namespace('/impred', ['pred']);
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
example._register('sleep', function(ms) {
    return function(nodalion, cb) {
	setTimeout(cb, ms);
    };
});

describe('workQueue', function(){
    describe('.connect(nodalion, url, queueDomain)', function(){
	it('should open a connection to the broker', function(){
	    workQueue.connect(n, 'amqp://localhost', example.myQueueDomain());
	});
    });
    describe('/nodalion:enqueue(Queue, Term, Type)', function(){
	it('should distribute work to queues', $T(function*(){
	    workQueue.connect(n, 'amqp://localhost', example.myQueueDomain());
	    stored = [];
	    yield doTask(ns.enqueue('example', "hello", {var:'T'}), $R());
	    yield doTask(ns.enqueue('example', "world", {var:'T'}), $R());
	    yield setTimeout($R(), 100);
	    assert.deepEqual(stored, ['hello', 'world']);
	}));
    });
    describe('/nodalion:forAll(Res, Impred)', function(){
	it('should provide all results for evaluating the given impred', $T(function*(){
	    var res = yield doTask(ns.forAll({var:'X'}, impred.pred(bs.listMember({var:'X'}, {var:'T'}, [1, 2, 3]))), $R());
	    assert.deepEqual(res, [1, 2, 3]);
	}));
    });
    describe('/nodalion:par(Task1, Task2)', function(){
	it('should evaluate both Task1 and Task2', $T(function*(){
	    var task1 = ns.forAll({var:'X'}, impred.pred(bs.listMember({var:'X'}, {var:'T'}, [1, 2])));
	    var task2 = ns.forAll({var:'X'}, impred.pred(bs.listMember({var:'X'}, {var:'T'}, [3, 4])));
	    var res = yield doTask(ns.par(task1, task2), $R());
	    assert.deepEqual(res, bs.pair([1, 2], [3, 4]));
	}));
	it('should run both tasks in parallel', $T(function*(){
	    var start = (new Date()).getTime();
	    yield doTask(ns.par(example.sleep(3), example.sleep(3)), $R());
	    var end = (new Date()).getTime();
	    assert(end - start <= 4, end + ' - ' + start + ' <= 4');
	}));

    });

});
