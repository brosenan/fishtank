"use strict";
var assert = require('assert');

var SerializationBuffer = require('../serializationBuffer.js');

describe('SerializationBuffer', function(){
    describe('.writeInt32(num)', function(){
	it('should serialize a number as a 32 bit integer', function(){
	    var buff = new SerializationBuffer(new Buffer(100));
	    buff.writeInt32(100);
	    buff.writeInt32(10000);
	    buff.writeInt32(1000000);
	    assert.equal(buff.readInt32(), 100);
	});
    });
    describe('.readInt32()', function(){
	it('should de-serialize int32 values', function(){
	    var buff = new SerializationBuffer(new Buffer(100));
	    buff.writeInt32(100);
	    buff.writeInt32(10000);
	    buff.writeInt32(1000000);
	    assert.equal(buff.readInt32(), 100);
	    assert.equal(buff.readInt32(), 10000);
	    assert.equal(buff.readInt32(), 1000000);
	});
    });

    describe('.writeInt24(num)', function(){
	it('should serialize a number as a 32 bit integer', function(){
	    var buff = new SerializationBuffer(new Buffer(100));
	    buff.writeInt24(100);
	    buff.writeInt24(10000);
	    buff.writeInt24(1000000);
	    assert.equal(buff.readInt24(), 100);
	});
    });
    describe('.readInt24()', function(){
	it('should de-serialize int32 values', function(){
	    var buff = new SerializationBuffer(new Buffer(100));
	    buff.writeInt24(100);
	    buff.writeInt24(10000);
	    buff.writeInt24(1000000);
	    assert.equal(buff.readInt24(), 100);
	    assert.equal(buff.readInt24(), 10000);
	    assert.equal(buff.readInt24(), 1000000);
	});
    });
    describe('.writeString(str)', function(){
	it('should serialize a string', function(){
	    var buff = new SerializationBuffer(new Buffer(100));
	    buff.writeString('hello');
	    buff.writeString('world');
	    assert.equal(buff.readString(), 'hello');
	    assert.equal(buff.readString(), 'world');
	});
    });
    describe('.writeByte(num)', function(){
	it('should serialize one byte', function(){
	    var buff = new SerializationBuffer(new Buffer(100));
	    buff.writeByte(3);
	    buff.writeByte(200);
	    assert.equal(buff.readByte(), 3);
	    assert.equal(buff.readByte(), 200);
	});
    });
    describe('.base64()', function(){
	it('should return a base64 string representing the serialized data', function(){
	    var buff = new SerializationBuffer(new Buffer(100));
	    buff.writeString('hello');
	    buff.writeByte(3);
	    buff.writeInt24(-10);
	    var b64 = buff.base64();
	    var buff2 = new SerializationBuffer(new Buffer(b64, 'base64'));
	    assert.equal(buff2.readString(), 'hello');
	    assert.equal(buff2.readByte(), 3);
	    assert.equal(buff2.readInt24(), -10);
	});

    });

});
