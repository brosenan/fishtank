"use strict";
var assert = require('assert');
var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var MongoClient = require('mongodb').MongoClient;

var nodalion = require('../nodalion.js');
var ns = nodalion.namespace('/nodalion', ['trans', 'set', 'append', 'get', 'value', 'check', 'getAll', 'mongoTest', 'mongo1']);
var nodalionMongo = require('../nodalionMongo.js');
var cedParser = require('../cedParser.js');

var parser = new cedParser.CedParser();

var doTask = function(term, cb) {
    var task = parser.parse(term.toString());
    task(cb);
};

var n = new nodalion('/tmp/mongo-ced.log');


describe('mongodb', function(){

    it('should work on the local machine', $T(function*(){
	var db = yield MongoClient.connect('mongodb://127.0.0.1:27017/test', $R());
	var coll = db.collection('test1');
	yield coll.remove({}, $R());
	yield coll.insert({_id: 'a', a:1}, $R());
	yield coll.insert({_id: 'b', a:2}, $R());
	yield coll.insert({_id: 'c', a:3}, $R());
	var arr = yield coll.find().toArray($R());
	assert.deepEqual(arr, [ { _id: 'a', a: 1 }, { _id: 'b', a: 2 }, { _id: 'c', a: 3 } ]);
	db.close();
    }));
});


describe('nodalionMongo', function(){
    var coll;
    beforeEach($T(function*() {
	var db = yield MongoClient.connect('mongodb://127.0.0.1:27017/test', $R());
	coll = db.collection('test2');
	yield coll.remove({}, $R());
    }));
    describe('.db(url)', function(){
	it('should connect to a database', function(){
	    nodalionMongo.db('mongodb://127.0.0.1:27017/test');
	});
    });
    describe('/nodalion:trans(coll, row, ops) => fields', function(){
	it('should not return any results unless asked for explicitly', $T(function*(){
	    yield doTask(ns.trans('test2', 'foo', [ns.set('a', ['1']), ns.set('b', ['2'])]), $R());
	    assert.deepEqual(yield doTask(ns.trans('test2', 'foo', []), $R()), []);
	}));

	describe('op /nodalion:set(key, values)', function(){
	    it('should assign values to key', $T(function*(){
		var result = yield doTask(ns.trans('test2', 'foo', [ns.set('bar', ['baz'])]), $R());
		assert.deepEqual(result, []);
		
		var docs = yield coll.find({_id: 'foo'}).toArray($R());
		assert.equal(docs.length, 1);
		assert.deepEqual(docs[0], {_id: 'foo', bar:['baz']});
	    }));
	});
	describe('op /nodalion:append(key, value)', function(){
	    it('should create a list of size 1 for an item that does not exist', $T(function*(){
		yield doTask(ns.trans('test2', 'foo', [ns.append('bar', 'baz')]), $R());
		
		var docs = yield coll.find({_id: 'foo'}).toArray($R());
		assert.equal(docs.length, 1);
		assert.deepEqual(docs[0], {_id: 'foo', bar:['baz']});
	    }));
	    it('should append an element to the list if already exists', $T(function*(){
		yield doTask(ns.trans('test2', 'foo', [ns.append('bar', 'baz1')]), $R());
		yield doTask(ns.trans('test2', 'foo', [ns.append('bar', 'baz2')]), $R());
		yield doTask(ns.trans('test2', 'foo', [ns.append('bar', 'baz3')]), $R());
		
		var docs = yield coll.find({_id: 'foo'}).toArray($R());
		assert.equal(docs.length, 1);
		assert.deepEqual(docs[0], {_id: 'foo', bar:['baz1', 'baz2', 'baz3']});
	    }));
	});
	describe('op /nodalion:get(key)', function(){
	    it('should return the requested key', $T(function*(){
		yield doTask(ns.trans('test2', 'foo', [ns.set('bar', ['a']), ns.set('baz', ['b'])]), $R());
		var result = yield doTask(ns.trans('test2', 'foo', [ns.get('bar'), ns.set('z', ['t'])]), $R());
		assert.deepEqual(result, [ns.value('bar', ['a'])]);
	    }));
	    it('should stand on its own without need for modification operations', $T(function*(){
		yield doTask(ns.trans('test2', 'foo', [ns.set('bar', ['a']), ns.set('baz', ['b'])]), $R());
		var result = yield doTask(ns.trans('test2', 'foo', [ns.get('bar')]), $R());
		assert.deepEqual(result, [ns.value('bar', ['a'])]);
	    }));
	});
	describe('op /nodalion:check(key, value)', function(){
	    it('should perform the transaction only if key maps to a single value - value', $T(function*(){
		// The following transaction will not occur because the pre-condition does not hold.
		yield doTask(ns.trans('test2', 'foo', [ns.set('x', ['1']), ns.check('a', ['7'])]), $R());
		assert.deepEqual(yield doTask(ns.trans('test2', 'foo', [ns.get('x')]), $R()), []);
	    }));
	});
	describe('op /nodalion:getAll', function(){
	    it('should return all keys for the given row', $T(function*(){
		yield doTask(ns.trans('test2', 'foo', [ns.set('bar', ['a']), ns.set('baz', ['b'])]), $R());
		var result = yield doTask(ns.trans('test2', 'foo', [ns.getAll()]), $R());
		assert.equal(result.length, 2);
	    }));

	});
	it('should integrate with Cedalion - 1', $T(function*(){
	    var X = {var:'X'};
	    var result = yield n.findAll(X, ns.mongoTest(1, X), $R());
	    assert.equal(result, 'bar');
	}));

	it('should integrate with Cedalion - 2', $T(function*(){
	    var X = {var:'X'};
	    var result = yield n.findAll(X, ns.mongoTest(2, X), $R());
	    assert.equal(result, '3');
	}));

	it('should integrate with Cedalion - 3', $T(function*(){
	    var X = {var:'X'};
	    var result = yield n.findAll(X, ns.mongoTest(3, X), $R());
	    assert.equal(result, '1.1');
	}));

    });
});
