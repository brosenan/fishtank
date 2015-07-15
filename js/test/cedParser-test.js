"use strict";

var assert = require("assert");
var cedParser = require("../cedParser.js");

describe('CedParser', function(){
    var parser = new cedParser.CedParser();
    describe('.parse(str)', function(){
	it('should parse a Cedalion string to a JS string', function(){
	    var str = parser.parse("!string");
	    assert.equal(typeof str, 'string');
	    assert.equal(str, 'string');
	});
	it('should handle strings with parentheses', function(){
	    assert.equal(parser.parse("!(string)"), 'string');
	});
	it('should handle quoted strings', function(){
	    assert.equal(parser.parse("!('string')"), 'string');
	});
	it('should handle quoted strings with arbitrary characters', function(){
	    assert.equal(parser.parse("!'This is a string'"), 'This is a string');
	});
	it('should handle quoted strings with escape sequences', function(){
	    assert.equal(parser.parse("!('\\'string\\\\')"), "\'string\\");
	});
	it('should handle quoted strings with non-identity escape sequences', function(){
	    assert.equal(parser.parse("!'string\\n\\t\\r'"), "string\n\t\r");
	});

    });

});
