"use strict";
var assert = require('assert');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };
var express = require('express');
var request = require('request');

var Nodalion = require('../nodalion.js');
var nodalionHttp = require('../http.js');

var ns = Nodalion.namespace('/nodalion', ['http']);
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

    });

});
