"use strict";
var SerializationBuffer = require('./serializationBuffer.js');

exports.STRING = 1;
exports.NUMBER = 2;
exports.TERM_OOD = 3;
exports.TERM = 4;
exports.VAR = 5;

var globalBuff = new Buffer(1<<20);

exports.serializeTerm = function(term, buff, nameDict, varMap) {
    varMap = varMap || { $next: 0 };
    if(typeof term === 'string') {
	buff.writeByte(exports.STRING);
	buff.writeString(term);
    } else if(typeof term === 'number') {
	buff.writeByte(exports.NUMBER);
	buff.writeNumber(term);
    } else if(term.name) {
	var code = term.args.length << 3;
	if(term.name in nameDict) {
	    buff.writeByte(exports.TERM | code);
	    buff.writeInt16(nameDict[term.name]);
	} else {
	    buff.writeByte(exports.TERM_OOD | code);
	    buff.writeString(term.name);
	}
	for(let i = 0; i < term.args.length; i++) {
	    exports.serializeTerm(term.args[i], buff, nameDict, varMap);
	}
    } else if(term.var) {
	buff.writeByte(exports.VAR);
	var varNum = varMap[term.var];
	if(typeof varNum === 'undefined') {
	    varNum = varMap.$next;
	    varMap.$next += 1;
	    varMap[term.var] = varNum;
	}
	buff.writeByte(varNum);
    } else {
	throw Error('Cannot serialize ' + term);
    }
};

function deserializeArgs(count, buff, nameArr) {
    var res = Array(count);
    for(let i = 0; i < count; i++) {
	res[i] = exports.deserializeTerm(buff, nameArr);
    }
    return res;
}

exports.deserializeTerm = function(buff, nameArr) {
    var type = buff.readByte();
    var count = type >> 3;
    switch(type & 7) {
    case exports.STRING:
	return buff.readString();
    case exports.NUMBER:
	return buff.readNumber();
    case exports.TERM_OOD:
	return  {name: buff.readString(), args: deserializeArgs(count, buff, nameArr)};
    case exports.TERM:
	return {name: nameArr[buff.readInt16()], args: deserializeArgs(count, buff, nameArr)};
    case exports.VAR:
	return {var: '_' + buff.readByte()};
    default:
	throw Error('Bad term type: ' + type);
    }
    return value;
};

exports.encodeTerm = function(term, nameDict) {
    var buff = new SerializationBuffer(globalBuff);
    exports.serializeTerm(term, buff, nameDict);
    return buff.base64();
};

exports.decodeTerm = function(base64, nameArr) {
    var buff = new SerializationBuffer(new Buffer(base64, 'base64'));
    return exports.deserializeTerm(buff, nameArr);
};
