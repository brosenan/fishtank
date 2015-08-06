"use strict";
var multiRep = require('./multiRep.js');

function encodeNum(num, low, high) {
    var m = num % low.length;
    if(m == num) {
	return low[m];
    } else {
	return high[m] + encodeNum(Math.floor(num / low.length), low, high);
    }
}

module.exports = function(args) {
    var encodingDict = Object.create(null);
    var decodingDict = Object.create(null);
    var normalChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var halfChars = Math.floor(normalChars.length / 2);
    var lowChars = normalChars.substring(0, halfChars);
    var highChars = normalChars.substring(halfChars, halfChars);
    var forbiddenEsc = '%';
    var commonEsc = '&';
    var forbiddenChars = args.forbiddenChars || '';
    var commonStrings = args.commonStrings || [];
    if(forbiddenChars !== '') {
	forbiddenChars += forbiddenEsc;
    }
    for(let i = 0; i < forbiddenChars.length; i++) {
	var c = forbiddenChars.charAt(i);
	encodingDict[c] = forbiddenEsc + encodeNum(i, lowChars, highChars);
	decodingDict[forbiddenEsc + encodeNum(i, lowChars, highChars)] = c;
    }
    commonStrings.forEach(function(str, i) {
	encodingDict[str] = commonEsc + encodeNum(i, lowChars, highChars);
	decodingDict[commonEsc + encodeNum(i, lowChars, highChars)] = str;
    });
    this.encode = multiRep(encodingDict);
    this.decode = multiRep(decodingDict);
};
var clazz = module.exports.prototype;

