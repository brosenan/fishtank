"use strict";
var cedGrammar = require('./cedGrammar.js');

function meaning(term) {
    if(typeof term === 'object') {
	return term.meaning();
    } else {
	return term;
    }
}

var registered = {
    '[]/0': () => [],
    './2': (first, next) => [first].concat(meaning(next)),
};

exports.CedParser = function() {
    this.registered = registered;
};

exports.Term = function(name, args) {
    this.name = name;
    this.args = args;
};

exports.Term.prototype.toString = function() {
    return exports.generate(this);
}
exports.Term.prototype.meaning = function() {
    var key = this.name + '/' + this.args.length;
    var ctor = registered[key];
    if(ctor) {
	return ctor.apply(null, this.args);
    } else {
	throw Error('Term ' + key + ' has no defined meaning');
    }
}

exports.CedParser.prototype.parse = function(str) {
    cedGrammar.parser.yy = exports;
    try {
	return cedGrammar.parse(str);
    } catch(e) {
	console.error('error while parsing ' + str);
	throw e;
    }
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
