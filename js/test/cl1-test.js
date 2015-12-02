"use strict";
var assert = require('assert');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };
var express = require('express');
var request = require('request');
var MongoClient = require('mongodb').MongoClient;

var Nodalion = require('../nodalion.js');
var nodalionHttp = require('../http.js');
var nodalionMongo = require('../nodalionMongo.js');
var workQueue = require('../workQueue.js');

var ns = Nodalion.namespace('/nodalion', ['defaultQueueDomain']);
var cl1 = Nodalion.namespace('/cl1', ['cl1']);
var nodalion = new Nodalion('/tmp/cl1.log');


describe('cl1', function(){
    before($T(function*() {
	workQueue.connect(nodalion, 'amqp://localhost', ns.defaultQueueDomain());
	nodalionMongo.db('mongodb://127.0.0.1:27017/test3');
	var app = express();
	app.use(nodalionHttp.app(nodalion, cl1.cl1()));
	app.listen(3003);
	yield setTimeout($R(), 10); // Give the app time to go up
    }));
    beforeEach($T(function*() {
	var db = yield MongoClient.connect('mongodb://127.0.0.1:27017/cl1test', $R());
	yield db.dropDatabase($R());
    }));
    describe('/static', function(){
	it('should store and then retrieve content', $T(function*(){
	    var ts = (new Date()).getTime();
	    var content = "The time is: " + ts;
	    var resp = yield request({
		method: 'PUT',
		url: 'http://localhost:3003/static/foo.txt',
		headers: {'content-type': 'text/foo'},
		body: content,
	    }, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[2], '{"status":"OK"}');

	    yield setTimeout($R(), 10);
	    resp = yield request('http://localhost:3003/static/foo.txt', $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[1].headers['content-type'].split(';')[0], 'text/foo');
	    assert.equal(resp[2], content);
	}));
    });
    describe('/encode', function(){
	it('should return a URL that represents the given term', $T(function*(){
	    var term = 'foo(bar, 2, "three", X)';
	    var resp = yield request({
		method: 'POST',
		url: 'http://localhost:3003/encode/q',
		headers: {'content-type': 'text/plain'},
		body: term,
	    }, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[1].headers['content-type'].split(';')[0], 'application/json');
	    assert.equal(JSON.parse(resp[2]).url, 'http://localhost:3003/q/QmNirCniYxrjgwsaVrak1bRLg9ooo4pXiY4gfeFtZAXoH1');
	}));
	it('should fail for an invalid term', $T(function*(){
	    var term = 'an invalid term';
	    var resp = yield request({
		method: 'POST',
		url: 'http://localhost:3003/encode/q',
		headers: {'content-type': 'text/plain'},
		body: term,
	    }, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 400);
	    assert.equal(resp[1].headers['content-type'].split(';')[0], 'text/plain');
	    assert.equal(resp[2], 'Invalid term: ' + term);
	}));
    });
    describe('/q', function(){
	var urls = [];
	var terms = ['<builtin:succ(1, X), builtin:succ(X, Y)>'];
	before($T(function*() {
	    for(let i = 0; i < terms.length; i++) {
		var resp = yield request({
		    method: 'POST',
		    url: 'http://localhost:3003/encode/q',
		    headers: {'content-type': 'text/plain'},
		    body: terms[i],
		}, $RR());
		assert.ifError(resp[0]);
		assert.equal(resp[1].statusCode, 200);
		urls.push(JSON.parse(resp[2]).url);
	    }
	}));
	it('should provide the solutions of the query', $T(function*(){
	    var resp = yield request(urls[0], $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[2], '[{"_count":1,"Y":3,"X":2}]');
	}));

    });

});
