"use strict";
var Namespace = require('./namespace.js');

module.exports = function(ced) {
    this.ced = ced;
};

var clazz = module.exports.prototype;

module.exports.namespace = function(name, concepts) {
    var ns = new Namespace(name);
    ns._define(concepts);
    return ns;
};

clazz.findAll = function(res, impred, cb) {
    var results = [];
    var sawError = false;
    var frames = 0;

    function handleEvents(em) {
	em.on('solution', function(sol) {
	    results.push(sol);
	});
	em.on('done', function() {
	    if(frames === 0 && !sawError) {
		cb(undefined, results);
	    } else {
		frames -= 1;
	    }
	});
	em.on('error', function(err) {
	    cb(err);
	    sawError = true;
	});
	em.on('continuation', function(task, cont) {
	    frames += 1;
	    handleEvents(task(cont));
	});
    }

    var em = this.ced.eval(res, impred);
    handleEvents(em);
};
