"use strict";
var assert = require('assert');

var serializeTerm = require('../serializeTerm.js');
var SerializationBuffer = require('../serializationBuffer.js');

describe('serializeTerm(term, buff, nameDict, [, varMap])', function(){
    it('should handle strings by serializing the STRING byte followed by a serialization of the string', function(){
	var buff = new SerializationBuffer(new Buffer(100));
	serializeTerm.serializeTerm("hello", buff, {});
	assert.equal(buff.readByte(), serializeTerm.STRING);
	assert.equal(buff.readString(), "hello");
    });
    it('should serialize numbers by serialing NUMBER followed by the number', function(){
	var buff = new SerializationBuffer(new Buffer(100));
	serializeTerm.serializeTerm(3.141592, buff, {});
	assert.equal(buff.readByte(), serializeTerm.NUMBER);
	assert.equal(buff.readNumber(), 3.141592);
    });
    it('should serialize atomic (out-of-dictionary) terms by writing TERM_OOD followed by the name as a string', function(){
	var buff = new SerializationBuffer(new Buffer(100));
	serializeTerm.serializeTerm({name: 'foo', args: []}, buff, {});
	assert.equal(buff.readByte(), serializeTerm.TERM_OOD);
	assert.equal(buff.readString(), 'foo');
    });
    it('should serialize atomic (in-dictionary) terms by writing TERM followed by the (16-bit) number in the dictionary', function(){
	var buff = new SerializationBuffer(new Buffer(100));
	serializeTerm.serializeTerm({name: 'foo', args: []}, buff, {foo: 123});
	assert.equal(buff.readByte(), serializeTerm.TERM);
	assert.equal(buff.readInt16(), 123);
    });

    it('should serialize compound terms by first serializing the arguments', function(){
	var buff = new SerializationBuffer(new Buffer(100));
	serializeTerm.serializeTerm({name: 'foo', args: ['bar', 2]}, buff, {foo: 123});
	assert.equal(buff.readByte(), serializeTerm.STRING);
	assert.equal(buff.readString(), 'bar');
	assert.equal(buff.readByte(), serializeTerm.NUMBER);
	assert.equal(buff.readNumber(), 2);
	// The term identifier is augmented with the number of arguments * 8
	assert.equal(buff.readByte(), serializeTerm.TERM + 2*8);
    });

    it('should serialize variables by giving numbering them', function(){
	var buff = new SerializationBuffer(new Buffer(100));
	serializeTerm.serializeTerm({name: 'foo', args: [{var: 'X'}, {var: 'Y'}, {var: 'X'}]}, buff, {});
	assert.equal(buff.readByte(), serializeTerm.VAR);
	assert.equal(buff.readByte(), 0); // X
	assert.equal(buff.readByte(), serializeTerm.VAR);
	assert.equal(buff.readByte(), 1); // Y
	assert.equal(buff.readByte(), serializeTerm.VAR);
	assert.equal(buff.readByte(), 0); // X
    });

});
