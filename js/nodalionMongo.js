"use strict";
var $S = require('suspend'), $R = $S.resume;
var MongoClient = require('mongodb').MongoClient;

var nodalion = require('./nodalion.js');

var ns = nodalion.namespace('/nodalion', []);


var _db;
var dbListeners = [];
function getDB(cb) {
    if(_db) {
	return cb(undefined, _db);
    } else {
	dbListeners.push(cb);
    }
}
exports.db = function(url) {
    MongoClient.connect(url, function(err, db) {
	_db = db;
	dbListeners.forEach(function(listener) {
	    listener(err, db);
	});
    });
};

ns._register('trans', function(coll, row, ops) {
    return $S.async(function*() {
	var db = yield getDB($R());
	var update = {};
	ops.forEach(function(op) {
	    op(update);
	});
	yield db.collection(coll).update({_id: row}, update, {upsert: true}, $R());
	return {};
    });
});

ns._register('set', function(key, value) {
    return function(update) {
	if(!update.$set) {
	    update.$set = {};
	}
	update.$set[key] = [value];
    };
});
