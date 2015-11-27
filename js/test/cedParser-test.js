"use strict";

var assert = require("assert");
var cedParser = require("../cedParser.js");

describe('CedParser', function(){
    var cedalionCode = "[:-('builtin#loadedStatement'(!('/home/boaz/cedalion/Functional/binop.ced'),'/bootstrap#signature'(::('/Functional#binOp'(A),'/bootstrap#type'),'.'(::(A,'/bootstrap#type'),[])),'.'('builtin#varName'(::(A,B),!('T')),[])),'builtin#true'), '/bootstrap#signature'(::('/Functional#binOp'(A),'/bootstrap#type'),'.'(::(A,'/bootstrap#type'),[])), :-('builtin#loadedStatement'(!('/home/boaz/cedalion/Functional/binop.ced'),'/bootstrap#defAtom'(::('/Functional#numPlus','/Functional#binOp'('/bootstrap#number'))),[]),'builtin#true'), '/bootstrap#defAtom'(::('/Functional#numPlus','/Functional#binOp'('/bootstrap#number'))), :-('builtin#loadedStatement'(!('/home/boaz/cedalion/Functional/binop.ced'),'/bootstrap#projection'(::('/Functional#numPlus','/Functional#binOp'('/bootstrap#number')),'/bootstrap#label'(!(+))),[]),'builtin#true'), '/bootstrap#projection'(::('/Functional#numPlus','/Functional#binOp'('/bootstrap#number')),'/bootstrap#label'(!(+))), :-('builtin#loadedStatement'(!('/home/boaz/cedalion/Functional/binop.ced'),'/bootstrap#signature'(::('/Functional#applyBinOp'(A,B,C),'/Functional#expr'(D)),'.'(::(A,'/Functional#expr'(D)),'.'(::(B,'/Functional#binOp'(D)),'.'(::(C,'/Functional#expr'(D)),[])))),'.'('builtin#varName'(::(A,E),!('Arg1')),'.'('builtin#varName'(::(B,F),!('Op')),'.'('builtin#varName'(::(C,G),!('Arg2')),'.'('builtin#varName'(::(D,H),!('T')),[]))))),'builtin#true'), :-('builtin#loadedStatement'(!('/home/boaz/cedalion/bootstrap/typesystem.ced'),'/bootstrap#projection'(::('/bootstrap#true'(A),'/bootstrap#pred'),'/bootstrap#horiz'('.'('/bootstrap#vis'(::(A,'/bootstrap#pred')),'.'('/bootstrap#label'(!(!)),[])))),'.'('builtin#varName'(::(A,B),!('Goal')),[])),'builtin#true')]";

    var parser;
    beforeEach(function() {
	parser = new cedParser.CedParser();
    });
    describe('.parse(str)', function(){
	it('should ignore whitespaces', function(){
	    assert.deepEqual(parser.parse('abc(a, b,\tc)\n'), parser.parse('abc(a,b,c)'));
	});
	it('should handle strings with parentheses', function(){
	    assert.equal(parser.parse("!(string)"), 'string');
	});
	it('should handle quoted strings', function(){
	    assert.equal(parser.parse("!('string')"), 'string');
	});
	it('should handle quoted strings with arbitrary characters', function(){
	    assert.equal(parser.parse("!('This is a string')"), 'This is a string');
	});
	it('should handle quoted strings with escape sequences', function(){
	    assert.equal(parser.parse("!('\\'string\\\\')"), "\'string\\");
	});
	it('should handle quoted strings with non-identity escape sequences', function(){
	    assert.equal(parser.parse("!('string\\n\\t\\r')"), "string\n\t\r");
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
	    assert.equal(parser.parse('[]').name, '[]');
	});

	it('should handle a non-empty list', function(){
	    var list = parser.parse('[a, b, c]');
	    assert.equal(list.name, '.');
	    assert.equal(list.args[0].name, 'a');
	    assert.equal(list.args[1].name, '.');
	    assert.equal(list.args[1].args[0].name, 'b');
	});

	it('should parse numbers', function(){
	    assert.deepEqual(parser.parse('[1, -2e+5, 3.14]').meaning(), [1, -2e+5, 3.14]);
	});
	
	it('should parse variables', function(){
	    var v = parser.parse('Foo');
	    assert.equal(v.var, 'Foo');
	});

	it('should support atoms made of special characters', function(){
	    parser.parse('~>(S, :-(Head, Body))');
	});
	it('should parse cedalion code', function(){
	    parser.parse(cedalionCode);
	});

    });
    describe('.register(concept, ctor)', function(){
	it('should register a constructor for evaluating compound terms through the .meaning() method', function(){
	    cedParser.register('const/1', function(a) { return a; });
	    cedParser.register('+/2', function(a, b) { return a.meaning()+b.meaning(); });
	    cedParser.register('*/2', function(a, b) { return a.meaning()*b.meaning(); });
	    assert.equal(parser.parse('+(const(1), *(const(2), const(3)))').meaning(), 7);
	});
    });
    describe('.generate(term)', function(){
	it('should convert a string to a string term', function(){
	    assert.equal(cedParser.generate('hello'), "!('hello')");
	});

	it('should escape special characters', function(){
	    assert.equal(cedParser.generate("'\n\r\t\\"), "!('\\'\\n\\r\\t\\\\')");
	});

	it('should handle atomic term objects', function(){
	    assert.equal(cedParser.generate({name: 'foo', args: []}), "'foo'");
	});

	it('should handle atomic term objects with special characters', function(){
	    assert.equal(cedParser.generate({name: 'foo\nbar', args: []}), "'foo\\nbar'");
	});

	it('should handle compound terms', function(){
	    assert.equal(cedParser.generate({name: 'foo', args: ['a', 'b']}), "'foo'(!('a'),!('b'))");
	});

	it('should handle variables', function(){
	    assert.equal(cedParser.generate({var: 'Foo'}), "Foo");
	});
	
	it('should handle lists', function(){
	    assert.equal(cedParser.generate(['a', 'b', 'c']), "[!('a'),!('b'),!('c')]");
	});

	it('should handle numbers', function(){
	    assert.equal(cedParser.generate(3.14), "3.14");
	});

	it('should handle anything parsed by .parse(), and then again', function(){
	    var parsed = parser.parse(cedalionCode);
	    var generated = cedParser.generate(parsed);
	    var parsed2 = parser.parse(generated);
	    assert.deepEqual(parsed, parsed2);
	});
    });
});
