"use strict";
var assert = require('assert');
var request = require('request');

var Nodalion = require('../nodalion.js');
var nodalionHTTP = require('../http.js');

var nodalion = new Nodalion('/tmp/nodalion.log');
var ns = Nodalion.namespace('/nodalion', ['test']);

var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

nodalionHTTP.server(nodalion, ns.test(), 12001);

describe('nodalionHTTP', function(){
    it('should create an HTTP server that consults the /nodalion#serveHttp/6 impred', $T(function*(){
	var resp = yield request('http://127.0.0.1:12001/hello?who=Nodalion', $S.resumeRaw());
	assert.ifError(resp[0]);
	if(resp[1].statusCode != 200) {
	    throw Error(resp[2]);
	}
	assert.equal(resp[1].headers['content-type'], 'text/plain');
	assert.equal(resp[2], "Hello, Nodalion");
    }));

});
