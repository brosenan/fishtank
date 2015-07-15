"use strict";
var cedGrammar = require('./cedGrammar.js');

exports.CedParser = function() {
    this.registered = {'!/1': function(str) { return str.name; }};
};

var clazz = exports.CedParser.prototype;
clazz.parse = function(str) {
    cedGrammar.parser.yy = this;
    return cedGrammar.parse(str);
};
