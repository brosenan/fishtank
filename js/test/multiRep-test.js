"use strict";

var assert = require('assert');

var multiRep = require('../multiRep.js');

describe('MultiRep', function(){
    it('should replace all occurences of strings keys in the dictionary with their values', function(){
	var rep = multiRep({'foo': 'FOO', 'bar': 'BAR'});
	assert.equal(rep('the foo and bar went to foobar'), 'the FOO and BAR went to FOOBAR');
    });
    it('should support all characters', function(){
	var rep = multiRep({'f$o.o': 'F{O}O', 'b[a]r': 'B(A)R'});
	assert.equal(rep('the f$o.o and b[a]r went to f$o.ob[a]r'), 'the F{O}O and B(A)R went to F{O}OB(A)R');
    });
    it('should support an empty dict', function(){
	var rep = multiRep(Object.create(null));
	assert.equal(rep('the foo and bar went to foobar'), 'the foo and bar went to foobar');
	
    });

});
