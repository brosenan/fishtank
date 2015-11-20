"use strict";

var assert = require("assert");
var Namespace = require("../namespace.js");
var cedParser = require("../cedParser.js");

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
    describe('._register(name, ctor)', function(){
	it('should register a meaning for a term', function(){
	    var parser = new cedParser.CedParser();
	    var foo = new Namespace('/foo', parser);
	    foo._register('plus', function(a, b) { return a+b; });
	    var res = parser.parse(foo.plus(1, 2).toString()).meaning();
	    assert.equal(res, 3);
	});
    });

    describe('.<concept>(args...)', function(){
	it('should return an object that has a .toString() method', function(){
	    var foo = new Namespace('/foo');
	    foo._define(['bar', 'baz']);
	    assert.equal(foo.bar().toString(), "'/foo#bar'");
	});
    });
});
