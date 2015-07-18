"use strict";
module.exports = function(ns) {
    this.ns = ns;
};

var clazz = module.exports.prototype;

clazz._define = function(names) {
    var self = this;
    names.forEach(function(name) {
	self[name] = function() {
	    return {name: self.ns + "#" + name, 
		    args: Array.prototype.slice.call(arguments)};
	};
    });
};
