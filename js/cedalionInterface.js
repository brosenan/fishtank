"use strict";
var EventEmitter = require('events').EventEmitter;
var spawn = require('child_process').spawn;
var byline = require('byline');
var cedParser = require('./cedParser.js');
var fs = require('fs');
var Namespace = require('./namespace.js');

var matchContinuation = /([0-9]+)[ \t]+(.*)/

var js = new Namespace('js');
js._define(['exception']);

function logger(out) {
    var input = new EventEmitter();
    input.on('data', function(data) {
	data = data.toString('utf-8');
	data.split('\n').forEach(line => {
	    out.write((new Date()).getTime() + '\t' + line + '\n');
	});
    });
    input.on('end', function() { out.close(); });
    input.write = function(str) {
	input.emit('data', str);
    };
    return input;
}

module.exports = function(logfile) {
    var self = this;
    this.prolog = spawn('swipl', ['-f', __dirname + '/../prolog/impred.pl', '-t', 'go']);
    this.prolog.stdout.setEncoding('utf-8');
    if(logfile) {
	this._log = logger(fs.createWriteStream(logfile));
	this.prolog.stderr.pipe(this._log);
	this.prolog.stdout.pipe(this._log);
    }
    this.lines = byline(this.prolog.stdout);
    this.lines.on('data', function(data) {
	try {
	    if(data.substr(0, 1) === '.') {
		self.em.emit('done');
		self._log.write('done\n');
		if(self.queue.length > 0) {
		    self.em = self.queue.shift();
		    self.send(self.em.req);
		} else {
		    self.em = null;
		}
	    } else if(data.substr(0, 2) === ': ') {
		self.em.emit('solution', self.parser.parse(data.substr(2)));
	    } else if(data.substr(0, 2) === '? ') {
		let m = data.substr(2).match(matchContinuation);
		if(m === null) {
		    throw Error("Bad response: " + data);
		}
		self.em.emit('continuation', self.parser.parse(m[2]), function(err, resp) {
		    if(err) {
			return self.request('throwInto(' + m[1] + ',' + js.exception(err.message).toString() + ')');
		    } else {
			return self.request('cont(' + m[1] + ',' + cedParser.generate(resp) + ')');
		    }
		});
	    } else if(data.substr(0, 2) === '! ') {
		let err = Error(data.substr(2));
		err._exception = self.parser.parse(data.substr(2));
		self.em.emit('error', err);
	    }
	} catch(e) {
	    console.error(e.stack);
	}
    });
    this.parser = new cedParser.CedParser();
    this.queue = [];
    this.em = null;
};

var clazz = module.exports.prototype;

clazz.eval = function(res, impred) {
    var req = 'eval(' + cedParser.generate(res) + ',' + cedParser.generate(impred) + ')';
    return this.request(req);
};

clazz.request = function(req) {
    if(this.em === null) {
	this.em = new EventEmitter();
	this.send(req);
	return this.em;
    } else {
	var em = new EventEmitter();
	em.req = req;
	this.queue.push(em);
	return em;
    }
};

clazz.send = function(req) {
    if(this._log) {
	this._log.write('> ' + req + '.\n');
    }
    this.prolog.stdin.write(req + '.\n');
};
