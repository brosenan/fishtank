"use strict";
var assert = require('assert');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };
var express = require('express');
var request = require('request');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');

var Nodalion = require('../nodalion.js');
var nodalionHttp = require('../http.js');
var nodalionMongo = require('../nodalionMongo.js');
var workQueue = require('../workQueue.js');

var ns = Nodalion.namespace('/nodalion', ['defaultQueueDomain']);
var cl1 = Nodalion.namespace('/cl1', ['cl1']);
var nodalion = new Nodalion('/tmp/cl1.log');

var dbURL = 'mongodb://127.0.0.1:27017/cl1test';

describe('cl1', function(){
    before($T(function*() {
	var db = yield MongoClient.connect(dbURL, $R());
	yield db.dropDatabase($R());

	workQueue.connect(nodalion, 'amqp://localhost', ns.defaultQueueDomain());
	nodalionMongo.db(dbURL);
	var app = express();
	app.use(nodalionHttp.app(nodalion, cl1.cl1()));
	app.listen(3003);
	yield setTimeout($R(), 10); // Give the app time to go up
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
	it('should take axioms from application/cedalion content', $T(function*(){
	    var input = fs.createReadStream(__dirname + '/test1.cedimg');
	    var req = request.put({url: 'http://localhost:3003/static/test1.cedimg',
				   headers: {'content-type': 'application/cedalion'}});
	    var resp = yield input.pipe(req).on('response', $RR());
	    assert.equal(resp[0].statusCode, 200);

	    var resp = yield request({method: 'POST',
				      url: 'http://localhost:3003/encode/q',
				      headers: {'content-type': 'text/plain'},
				      body: 'foo:baz(1, X)',
				     }, $RR());
	    assert.equal(resp[1].statusCode, 200);
	    var queryURL = JSON.parse(resp[2]);

	    yield setTimeout($R(), 300);
	    
	    resp = yield request(queryURL, $RR());
	    assert.equal(resp[1].statusCode, 200);
	    var res = JSON.parse(resp[2]).map(x => x.X);
	    assert.equal(res.length, 3);
	    assert.equal(res.reduce((x, y) => x+y), 9);
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
	    var buf = new Buffer(Buffer.byteLength(term));
	    buf.write(term);
	    assert.equal(JSON.parse(resp[2]).url, 'http://localhost:3003/q/' + buf.toString('base64'));
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
	var terms = [
	    '<builtin:succ(1, X), builtin:succ(X, Y)>',
	    '<bs:listMember(X, bs:number, [1, 2, 3])>',
	    '<bs:listMember(S, bs:string, ["abc", "abd", "cde", "cdf"]), builtin:strcat(Prefix, Suffix, S)>',
	    '<bs:listMember(N, bs:number, [1, 2, 3, 4, 5]), builtin:greaterThen(N, Min)>',
	    '<cl1:assign(foo, T, X)>'];
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
	it('should accept import-* query params to assign imports', $T(function*(){
	    var resp = yield request(urls[1] + "?import-bs=/bootstrap", $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[2], '[{"_count":1,"X":1},{"_count":1,"X":2},{"_count":1,"X":3}]');
	}));
	it('should accept str-* query params to assign strings to variables', $T(function*(){
	    var resp = yield request(urls[2] + "?import-bs=/bootstrap&str-Prefix=cd", $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    var res = JSON.parse(resp[2]);
	    assert.deepEqual(res.map(rec => rec.S), ['cde', 'cdf']);
	}));
	it('should accept num-* query params to assign numbers to variables', $T(function*(){
	    var resp = yield request(urls[3] + "?import-bs=/bootstrap&num-Min=2", $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    var res = JSON.parse(resp[2]);
	    assert.deepEqual(res.map(rec => rec.N), [3, 4, 5]);
	}));
	it('should use the domain name as package', $T(function*(){
	    var resp = yield request(urls[4] + "?import-cl1=/cl1", $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    var res = JSON.parse(resp[2]);
	    assert.deepEqual(res.map(rec => rec.X.name), ['localhost#foo']);
	}));
    });
    describe('/cloudlog', function(){
	it('should store and retrieve cloudlog files', $T(function*(){
	    var ts = (new Date()).getTime();
	    var content = "theTimeIs(foo, " + ts + "):-!.";
	    var url = 'http://localhost:3003/cloudlog/time.clg';
	    var resp = yield request({
		method: 'PUT',
		url: url,
		headers: {'content-type': 'text/cloudlog'},
		body: content,
	    }, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[2], '{"status":"OK"}');

	    yield setTimeout($R(), 10);
	    resp = yield request(url, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[1].headers['content-type'].split(';')[0], 'text/cloudlog');
	    assert.equal(resp[2], content);
	}));
	it('should return 400 in case of a syntax error in a PUT', $T(function*(){
	    var content = "this is not cloudlog";
	    var url = 'http://localhost:3003/cloudlog/err.clg';
	    var resp = yield request({
		method: 'PUT',
		url: url,
		headers: {'content-type': 'text/cloudlog'},
		body: content,
	    }, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 400);
	    assert.equal(resp[2], '{"status":"ERROR","error":"Syntax Error"}');
	}));
    });
    describe('/idx', function(){
	it('should expose matching facts', $T(function*(){
	    var facts = 'foo(1, "a"). foo(1, "b"). foo(2, "a").';
	    var indexDef = 'cloudlog:index(0, bar(Y), foo(X, Y)).';
	    var index = 'bar(X)';
	    var resp = yield request({
		method: 'PUT',
		url: 'http://localhost:3003/cloudlog/index-test.clg',
		headers: {'content-type': 'text/cloudlog'},
		body: facts + indexDef,
	    }, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    
	    resp = yield request({
		method: 'POST',
		url: 'http://localhost:3003/encode/idx',
		headers: {'content-type': 'text/cloudlog'},
		body: index,
	    }, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    var url = JSON.parse(resp[2]).url;

	    yield setTimeout($R(), 200);

	    resp = yield request(url + '?str-X=a', $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    
	    var res = JSON.parse(resp[2]);
	    assert.deepEqual(res.map(fact => fact.Fact.args[0]), [1, 2]);
	}));

    });

    it('should evaluate programs', $T(function*(){
	var program = 'father(GF, F) -> father(F, C) -> grandfather(GF, C).\n' +
	    'grandfather(GF, C) -> isGrandfather(GF, C) :- !.\n' +
	    'father("abraham", "isacc").\n' +
	    'father("abraham", "ismael").\n' +
	    'father("isacc", "jacob").\n' +
	    'father("isacc", "esau").\n';
	var url = 'http://localhost:3003/cloudlog/fathers.clg';
	var resp = yield request({
	    method: 'PUT',
	    url: url,
	    headers: {'content-type': 'text/cloudlog'},
	    body: program,
	}, $RR());
	assert.ifError(resp[0]);
	assert.equal(resp[1].statusCode, 200);
	assert.equal(resp[2], '{"status":"OK"}');

	var query = 'isGrandfather(X, Y)';
	resp = yield request({
	    method: 'POST',
	    url: 'http://localhost:3003/encode/q',
	    headers: {'content-type': 'text/cloudlog'},
	    body: query,
	}, $RR());
	assert.ifError(resp[0]);
	assert.equal(resp[1].statusCode, 200);
	url = JSON.parse(resp[2]).url;

	yield setTimeout($R(), 300); // Give the code enough time to propagate

	resp = yield request(url + '?str-X=abraham', $RR());
	assert.ifError(resp[0]);
	assert.equal(resp[1].statusCode, 200);
	assert.deepEqual(JSON.parse(resp[2]).map(x => x.Y), ['jacob', 'esau']);
    }));
});
