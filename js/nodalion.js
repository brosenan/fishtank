"use strict";
var Namespace = require('./namespace.js');

module.exports = function(ced) {
    this.ced = ced;
};

var clazz = module.exports.prototype;

clazz.namespace = function(name, concepts) {
    var ns = new Namespace(name, this.ced.parser);
    ns._define(concepts);
    return ns;
};

clazz.findAll = function(res, impred, cb) {
    var em = this.ced.eval(res, impred);
    var results = [];
    var sawError = false;
    em.on('solution', function(sol) {
	results.push(sol);
    });
    em.on('done', function() {
	if(!sawError) {
	    cb(undefined, results);
	}
    });
    em.on('error', function(err) {
	cb(err);
	sawError = true;
    });
};
