"use strict";
exports.STRING = 1;
exports.NUMBER = 2;
exports.TERM_OOD = 3;
exports.TERM = 4;
exports.VAR = 5;

exports.serializeTerm = function(term, buff, nameDict, varMap) {
    varMap = varMap || { $next: 0 };
    if(typeof term === 'string') {
	buff.writeByte(exports.STRING);
	buff.writeString(term);
    } else if(typeof term === 'number') {
	buff.writeByte(exports.NUMBER);
	buff.writeNumber(term);
    } else if(term.name) {
	for(let i = 0; i < term.args.length; i++) {
	    exports.serializeTerm(term.args[i], buff, nameDict, varMap);
	}
	var code = term.args.length << 3;
	if(term.name in nameDict) {
	    buff.writeByte(exports.TERM | code);
	    buff.writeInt16(nameDict[term.name]);
	} else {
	    buff.writeByte(exports.TERM_OOD | code);
	    buff.writeString(term.name);
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
