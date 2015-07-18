"use strict";

var CedParser = require('./cedParser.js').CedParser;

module.exports = function(ns) {
    this.ns = ns;
};

var clazz = module.exports.prototype;

function Term(name, args) {
    this.name = name;
    this.args = args;
};

Term.prototype.toString = function() {
    return CedParser.prototype.generate(this);
};

clazz._define = function(names) {
    var self = this;
    names.forEach(function(name) {
	self[name] = function() {
	    return new Term(self.ns + "#" + name, Array.prototype.slice.call(arguments));
	};
    });
};
