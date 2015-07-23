"use strict";
var assert = require('assert');
var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var MongoClient = require('mongodb').MongoClient;

var nodalion = require('../nodalion.js');
var ns = nodalion.namespace('/nodalion', ['trans', 'set', 'append']);
var nodalionMongo = require('../nodalionMongo.js');
var cedParser = require('../cedParser.js');

var parser = new cedParser.CedParser();


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
	describe('op /nodalion:set(key, value)', function(){
	    it('should assign value to key', $T(function*(){
		var task = parser.parse(ns.trans('test2', 'foo', [ns.set('bar', 'baz')]).toString());
		var result = yield task($R());
		assert.deepEqual(result, {});
		
		var docs = yield coll.find({_id: 'foo'}).toArray($R());
		assert.equal(docs.length, 1);
		assert.deepEqual(docs[0], {_id: 'foo', bar:['baz']});
	    }));
	});
	describe('op /nodalion:append(key, value)', function(){
	    it('should create a list of size 1 for an item that does not exist', $T(function*(){
		var task = parser.parse(ns.trans('test2', 'foo', [ns.append('bar', 'baz')]).toString());
		var result = yield task($R());
		
		var docs = yield coll.find({_id: 'foo'}).toArray($R());
		assert.equal(docs.length, 1);
		assert.deepEqual(docs[0], {_id: 'foo', bar:['baz']});
	    }));
	    it('should append an element to the list if already exists', $T(function*(){
		var task = parser.parse(ns.trans('test2', 'foo', [ns.append('bar', 'baz')]).toString());
		yield task($R());
		yield task($R());
		yield task($R());
		
		var docs = yield coll.find({_id: 'foo'}).toArray($R());
		assert.equal(docs.length, 1);
		assert.deepEqual(docs[0], {_id: 'foo', bar:['baz', 'baz', 'baz']});
	    }));

	});

    });
});
