"use strict";
var $S = require('suspend'), $R = $S.resume;
var Nodalion = require('./nodalion.js');
var serializeTerm = require('./serializeTerm.js');

var PREFETCH = 10;

var ns = Nodalion.namespace('/nodalion', ['workQueue', 'applyWork']);

var topics = {};

var connected = false;
var connErr;
var connCBs = [];

function waitForConnection(cb) {
    if(connected) {
	cb();
    } else {
	connCBs.push(cb);
    }
}

function notifyConnected(err) {
    connected = true;
    connErr = err;
    connCBs.forEach(function(x) { x(err); });
    connCBs = [];
}

function handleDataForSpec(nodalion, spec, worker) {
    return function(data) {
	var term = serializeTerm.decodeTerm(data, []);
	nodalion.findAll([], ns.applyWork(term, spec[2], spec[1], spec[3]), function(err) {
	    if(err) {
		console.error(err.stack);
	    }
	    worker.ack();
	});
    };
}

var doConnect = $S.async(function*(nodalion, url, domain) {
    var context = require('rabbit.js').createContext(url);
    var workerSpecs = yield nodalion.findAll([{var:'Name'}, {var:'X'}, {var:'T'}, {var:'Impred'}],
					     ns.workQueue(domain, {var:'Name'}, {var:'X'}, {var:'T'}, {var:'Impred'}), $R());
    for(let i = 0; i < workerSpecs.length; i++) {
	let spec = workerSpecs[i];
	let worker = context.socket('WORKER', {prefetch: PREFETCH});
	worker.setEncoding('utf8'); // use strings
	yield worker.connect(spec[0], $S.resumeRaw());
	worker.on('data', handleDataForSpec(nodalion, spec, worker));

	let pusher = context.socket('PUSH');
	yield pusher.connect(spec[0], $S.resumeRaw());
	topics[spec[0]] = {worker: worker, pusher: pusher};
    }
});

exports.connect = function(nodalion, url, domain) {
    doConnect(nodalion, url, domain, function(err) {
	notifyConnected(err);
    });
};

ns._register('enqueue', function(Queue, Term, Type) {
    return $S.async(function*(nodalion) {
	yield waitForConnection($R());
	topics[Queue].pusher.write(serializeTerm.encodeTerm(Term, {}));
	return Term;
    });
});
