"use strict";
module.exports = function(args) {
    this.forbiddenChars = args.forbiddenChars;
};
var clazz = module.exports.prototype;

clazz.encode = function(str) {
    return str;
};
clazz.decode = function(str) {
    return str;
};
