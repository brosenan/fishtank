"use strict";

var assert = require('assert');

var DictEncoder = require('../dictEncoder.js');

var testString = 'abcdEFGH123890.!@#$%(*&)xyZ';

describe('DictEncoder', function(){
    describe('default behavior', function(){
	it('should encode a string to itself', function(){
	    var encoder = new DictEncoder({});
	    assert.equal(encoder.encode(testString), testString);
	    assert.equal(encoder.decode(testString), testString);
	});
    });
    describe('forbiddenChars', function(){
	it('should avoid forbiddenChars in the encoded string', function(){
	    var encoder = new DictEncoder({
		forbiddenChars: '.$',
	    });
	    var enc = encoder.encode(testString);
	    assert.equal(enc.indexOf('.'), -1);
	    assert.equal(enc.indexOf('$'), -1);
	    assert.equal(encoder.decode(enc), testString);
	});
	it('should also encode the escape character', function(){
	    var testString = '.%a';
	    var encoder = new DictEncoder({
		forbiddenChars: '.',
	    });
	    assert.equal(encoder.decode(encoder.encode(testString)), testString);
	});
    });
    describe('commonStrings', function(){
	it('should replace common strings with escape sequences that are shorter than the string', function(){
	    var encoder = new DictEncoder({
		commonStrings: ['hello', 'world', 'goodbye'],
	    });
	    var testString = "hello &a goodbye, world";
	    var enc = encoder.encode(testString);
	    assert.equal(enc.length, 13);
	    assert.equal(encoder.decode(enc), testString);
	});
    });
});
