"use strict";
var cedGrammar = require('./cedGrammar.js');


var registered = {
    // String handling
    '!/1': function(str) { return str.name; },
    './2': function(first, next) { return [first].concat(next); },
};

exports.CedParser = function() {
    this.registered = registered;
};

var clazz = exports.CedParser.prototype;
clazz.parse = function(str) {
    cedGrammar.parser.yy = this;
    return cedGrammar.parse(str);
};

exports.register = function(concept, ctor) {
    registered[concept] = ctor;
};

var escapeChar = {
    "'": "\\'",
    "\n": "\\n",
    "\r": "\\r",
    "\t": "\\t",
    "\\": "\\\\",
};
for(let i = 0; i < 255; i++) {
    var c = String.fromCharCode(i);
    escapeChar[c] = escapeChar[c] || c;
}

function escape(str) {
    var buff = Array(str.length);
    for(let i = 0; i < str.length; i++) {
	buff[i] = escapeChar[str.charAt(i)];
    }
    return buff.join('');
}

var generators = {
    'string': function(term) {
	return "!('" + escape(term) + "')";
    },
    'object': function(term) {
	if(Array.isArray(term)) {
	    return '[' + term.map(exports.generate).join(',') + ']';
	}
	
	if(term.var) return term.var;

	var s = "'" + escape(term.name) + "'";
	if(term.args.length > 0) {
	    s += '(' + term.args.map(exports.generate).join(',') + ')';
	}
	return s;
    },
    'number': function(term) {
	return '' + term;
    },
    'undefined': function() {
	throw Error('Attempting to generate undefined as term');
    },
    'function': function(term) {
	var s = "'" + escape(term._name) + "'";
	if(term._args.length > 0) {
	    s += '(' + term._args.map(exports.generate).join(',') + ')';
	}
	return s;
    }
};

exports.generate = function(term) {
    return generators[typeof term](term);
};
