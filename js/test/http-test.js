"use strict";
var assert = require('assert');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };
var express = require('express');
var request = require('request');

var Nodalion = require('../nodalion.js');
var nodalionHttp = require('../http.js');
var cedParser = require('../cedParser.js');
var objStore = require('../objStore.js');

var ns = Nodalion.namespace('/nodalion', ['http', 'jsonObj', 'jsonList', 'jsonStr', 'jsonNum', 'field']);
var example = Nodalion.namespace('example', ['myApp']);

var nodalion = new Nodalion('/tmp/http.log');

describe('http', function(){
    describe('.app(nodalion, app)', function(){
	it('should return an Express router', $T(function*(){
	    var app = express();
	    app.use(nodalionHttp.app(nodalion, example.myApp()));
	    app.listen(3001);
	    yield setTimeout($R(), 10); // Give the app time to go up
	    var resp = yield request('http://localhost:3001/hello', $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[2], 'Hello, World');
	}));
    });
    describe('handlers', function(){
	before($T(function*() {
	    var app = express();
	    app.use(nodalionHttp.app(nodalion, example.myApp()));
	    app.listen(3002);
	    yield setTimeout($R(), 10); // Give the app time to go up
	}));
	it('should handle JSON', $T(function*(){
	    var resp = yield request('http://localhost:3002/hi-json', $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[2], '["str",2,{"a":2}]');
	}));
	it('should handle JSON with typeTerms', $T(function*(){
	    var resp = yield request('http://localhost:3002/json-with-ced-values', $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    var res = JSON.parse(resp[2]);
	    assert.equal(res[0], "str");
	    assert.equal(res[1], 2);
	    assert.equal(res[2].name, 'builtin#succ');
	}));
	it('should handle dynamic content', $T(function*(){
	    var resp = yield request('http://localhost:3002/calc?a=2&b=3', $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[2], '{"result":5}');
	}));
	it('should handle objStore content requests', $T(function*(){
	    var hash = yield objStore.addString('Hello, World\n', $R());
	    var resp = yield request('http://localhost:3002/objStore/' + hash, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[1].headers['content-type'].split(';')[0], 'text/foo');
	    assert.equal(resp[2], 'Hello, World\n');
	}));
	it('should handle objStore add requests', $T(function*(){
	    var resp = yield request({
		url: 'http://localhost:3002/objStore',
		method: 'POST',
		headers: {'content-type': 'text/foo'},
		body: 'Hello, World\n',
	    }, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    var url = JSON.parse(resp[2]).url;
	    resp = yield request(url, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[2], 'Hello, World\n');
	}));

	it('should handle json POST requests', $T(function*(){
	    var resp = yield request({
		url: 'http://localhost:3002/hello',
		method: 'POST',
		json: true,
		body: {firstName: 'Boaz', lastName: 'Rosenan'},
	    }, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[2], 'hello, Boaz Rosenan');
	}));

	it('should handle text POST requests', $T(function*(){
	    var resp = yield request({
		url: 'http://localhost:3002/helloText',
		method: 'POST',
		headers: {'content-type': 'text/plain'},
		body: "Boaz",
	    }, $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 200);
	    assert.equal(resp[2], 'hello, Boaz');
	}));
	it('should be able to provide arbitrary status', $T(function*(){
	    var resp = yield request('http://localhost:3002/someStatus?status=402', $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 402);
	}));
	it('should handle exceptions in the with/where handler by processing replacing the original handlers by the ones in the exception', $T(function*(){
	    var resp = yield request('http://localhost:3002/throw', $RR());
	    assert.ifError(resp[0]);
	    assert.equal(resp[1].statusCode, 400);
	    assert.equal(resp[2], 'This comes from the exception');
	}));

    });
    describe('.jsonToTerm(json)', function(){
	it('should convert a json value to a term representation', function(){
	    var parser = new cedParser.CedParser();
	    var json = ["str", 2, {"a": 2}];
	    var term = nodalionHttp.jsonToTerm(json);
	    var json2 = parser.parse(cedParser.generate(term));
	    assert.deepEqual(term, ns.jsonList([ns.jsonStr("str"),
						ns.jsonNum(2),
						ns.jsonObj([ns.field("a", ns.jsonNum(2))])]));
	});
    });
});
