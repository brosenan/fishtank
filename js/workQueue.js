"use strict";
var $S = require('suspend'), $R = $S.resume;
var Nodalion = require('./nodalion.js');
var serializeTerm = require('./serializeTerm.js');

var PREFETCH = 10;

var ns = Nodalion.namespace('/nodalion', ['workQueue', 'applyWork']);
var bs = Nodalion.namespace('/bootstrap', ['pair']);

var topics = {};

var connectCtr = 0;
var connErr;
var connCBs = [];

function waitForConnection(cb) {
    if(connectCtr == 0) {
	cb();
    } else {
	connCBs.push(cb);
    }
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
	let spec = workerSpecs[i].meaning();
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
    connectCtr += 1;
    doConnect(nodalion, url, domain, function(err) {
	connectCtr -= 1;
	connErr = err;
	if(connectCtr == 0) {
	    connCBs.forEach(function(x) { x(err); });
	    connCBs = [];
	}
    });
};

ns._register('enqueue', function(Queue, Term, Type) {
    return $S.async(function*(nodalion) {
	yield waitForConnection($R());
	var topic = topics[Queue];
	if(!topic) throw Error("Bad queue: " + Queue + ' available topics: ' + Object.keys(topics).join(', '));
	topic.pusher.write(serializeTerm.encodeTerm(Term, {}));
	return '';
    });
});

ns._register('findAll', function(Res, Impred) {
    return $S.async(function*(nodalion) {
	return yield nodalion.findAll(Res, Impred, $R());
    });
});

ns._register('par', function(Task1, Task2) {
    return $S.async(function*(nodalion) {
	Task1.meaning()(nodalion, $S.fork());
	Task2.meaning()(nodalion, $S.fork());
	var results = yield $S.join();
	return bs.pair(results[0], results[1]);
    });
});
