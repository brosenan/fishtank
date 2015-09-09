"use strict";
module.exports = function(buff) {
    this.buff = buff;
    this.writePtr = 0;
    this.readPtr = 0;
};

var proto = module.exports.prototype;

proto.writeInt = function(num, width) {
    this.writePtr = this.buff.writeIntBE(num, this.writePtr, width);
}

proto.writeUInt = function(num, width) {
    this.writePtr = this.buff.writeUIntBE(num, this.writePtr, width);
}

proto.writeInt32 = function(num) {
    this.writeInt(num, 4);
};
proto.writeInt24 = function(num) {
    this.writeInt(num, 3);
};
proto.writeInt16 = function(num) {
    this.writeInt(num, 2);
};

proto.readInt = function(width) {
    var ret = this.buff.readIntBE(this.readPtr, width);
    this.readPtr += width;
    return ret;
};

proto.readUInt = function(width) {
    var ret = this.buff.readUIntBE(this.readPtr, width);
    this.readPtr += width;
    return ret;
};

proto.readInt32 = function() {
    return this.readInt(4);
};
proto.readInt24 = function() {
    return this.readInt(3);
};
proto.readInt16 = function() {
    return this.readInt(2);
};

proto.writeString = function(str) {
    var len = this.buff.write(str, this.writePtr + 2, 'utf8');
    this.writeInt(len, 2);
    this.writePtr += len;
};

proto.readString = function() {
    var len = this.readInt(2);
    this.readPtr += len;
    return this.buff.toString('utf8', this.readPtr - len, this.readPtr);
};

proto.writeByte = function(num) {
    this.writeUInt(num, 1);
};
proto.readByte = function() {
    return this.readUInt(1);
};
proto.writeNumber = function(num) {
    this.writePtr = this.buff.writeDoubleBE(num, this.writePtr);
};
proto.readNumber = function(num) {
    this.readPtr += 8;
    return this.buff.readDoubleBE(this.readPtr - 8);
};

proto.base64 = function() {
    return this.buff.toString('base64', 0, this.writePtr);
};
