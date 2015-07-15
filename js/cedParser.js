"use strict";
var cedGrammar = require('./cedGrammar.js');

exports.CedParser = function() {
};

var clazz = exports.CedParser.prototype;
clazz.parse = function(str) {
    return cedGrammar.parse(str);
};
