"use strict";

var assert  = require('assert');

var $S = require('suspend'), $R = $S.resume, $T = function(gen) { return function(done) { $S.run(gen, done); } };

function streamToList(stream, cb) {
    var list = [];
    stream.on('data', function(data) { list.push(data); });
    stream.on('end', function() { cb(undefined, list); });
    stream.on('error', cb);
}

describe('rabbit.js', function(){
    it('should pass a message between a publisher and a subscriber', $T(function*(){
	var context = require('rabbit.js').createContext();
	//yield context.on('ready', $S.resumeRaw());
	var pusher = context.socket('PUSH');
	var worker1 = context.socket('WORKER', {prefetch: 1});
	var worker2 = context.socket('WORKER', {prefetch: 1});
	worker1.setEncoding('utf8');
	worker2.setEncoding('utf8');
	var topic = "ev" + (Math.floor(Math.random() * 1000000));
	yield worker1.connect(topic, $S.resumeRaw());
	yield worker2.connect(topic, $S.resumeRaw());
	yield pusher.connect(topic, $S.resumeRaw());
	
	pusher.write("hello", 'utf8');
	pusher.write("world", 'utf8');
	pusher.write("hola", 'utf8');
	pusher.write("mondi", 'utf8');
	var w1 = [];
	var w2 = [];
	var count = 4;
	function createTarget(list, worker, cb) {
	    return function(data) {
		list.push(data);
		count -= 1;
		worker.ack();
		if(count == 0) {
		    cb();
		}
	    }
	}
	var cb = $R();
	worker1.on('data', createTarget(w1, worker1, cb));
	worker2.on('data', createTarget(w2, worker2, cb));
	yield;
	assert.deepEqual(w1, ['hello', 'hola']);
	assert.deepEqual(w2, ['world', 'mondi']);
    }));
});
