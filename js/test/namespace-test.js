"use strict";

var assert = require("assert");
var Namespace = require("../namespace.js");

describe('namespace', function(){
    describe('._define(names)', function(){
	it('should create a function for each given name', function(){
	    var foo = new Namespace('/foo');
	    foo._define(['bar', 'baz']);
	    assert.equal(typeof foo.bar, 'function');
	    assert.equal(typeof foo.baz, 'function');
	    // The defined functions should return term objects under that namespace
	    assert.deepEqual(foo.bar(1, 2), {name: '/foo#bar', args: [1, 2]});
	});
    });
});
