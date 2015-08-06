"use strict";
var multiRep = require('./multiRep.js');

module.exports = function(args) {
    var encodingDict = Object.create(null);
    var decodingDict = Object.create(null);
    var normalChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var esc = '%';
    var forbiddenChars = args.forbiddenChars || '';
    for(let i = 0; i < forbiddenChars.length; i++) {
	var c = forbiddenChars.charAt(i);
	encodingDict[c] = esc + normalChars[i];
	decodingDict[esc + normalChars[i]] = c;
    }
    this.encode = multiRep(encodingDict);
    this.decode = multiRep(decodingDict);
};
var clazz = module.exports.prototype;

