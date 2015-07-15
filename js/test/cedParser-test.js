"use strict";

var assert = require("assert");
var cedParser = require("../cedParser.js");

describe('CedParser', function(){
    var parser = new cedParser.CedParser();
    describe('.parse(str)', function(){
	it('should ignore whitespaces', function(){
	    assert.deepEqual(parser.parse('abc(a, b,\tc)\n'), parser.parse('abc(a,b,c)'));
	});
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
	it('should handle atomic terms', function(){
	    var term = parser.parse("atomic");
	    assert.equal(term.name, 'atomic');
	    assert.equal(term.args.length, 0);
	});
	it('should handle compound terms', function(){
	    var term = parser.parse("'my#compound'(a,b)");
	    assert.equal(term.name, 'my#compound');
	    assert.equal(term.args.length, 2);
	});
	it('should handle nested compound terms', function(){
	    var term = parser.parse("comp1(comp2(a),b)");
	    assert.equal(term.name, 'comp1');
	    assert.equal(term.args.length, 2);
	    assert.equal(term.args[0].name, 'comp2');
	    assert.equal(term.args[0].args[0].name, 'a');
	});

	it('should handle an empty list', function(){
	    assert.deepEqual(parser.parse('[]'), []);
	});

	it('should handle a non-empty list', function(){
	    var list = parser.parse('[a, b, c]');
	    assert.equal(list.length, 3);
	    assert.equal(list[0].name, 'a');
	});

	it('should parse numbers', function(){
	    assert.deepEqual(parser.parse('[1, 2e+5, 3.14]'), [1, 2e+5, 3.14]);
	});
	
	it('should parse variables', function(){
	    var v = parser.parse('Foo');
	    assert.equal(v.var, 'Foo');
	});

	it('should support atoms made of special characters', function(){
	    parser.parse('~>(S, :-(Head, Body))');
	});

    });
});
