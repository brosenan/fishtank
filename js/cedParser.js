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

clazz.register = function(concept, ctor) {
    this.registered[concept] = ctor;
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
	    return '[' + term.map(clazz.generate).join(',') + ']';
	}
	
	if(term.var) return term.var;

	var s = "'" + escape(term.name) + "'";
	if(term.args.length > 0) {
	    s += '(' + term.args.map(clazz.generate).join(',') + ')';
	}
	return s;
    },
    'number': function(term) {
	return '' + term;
    },
    'undefined': function() {
	throw Error('Attempting to generate undefined as term');
    },
};

clazz.generate = function(term) {
    return generators[typeof term](term);
};
