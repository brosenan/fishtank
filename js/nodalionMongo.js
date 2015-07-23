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
	var fields = {};
	ops.forEach(function(op) {
	    op(update, fields);
	});	
	var result;
	if(Object.keys(update).length > 0) {
	    result = yield db.collection(coll).findOneAndUpdate({_id: row}, 
								    update, 
								    {upsert: true, 
								     projection: fields}, $R());
	} else {
	    result = yield db.collection(coll).findOne({_id: row}, {fields: fields}, $R());
	}
	if(result.value) delete result.value._id;
	return result.value || {};
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

ns._register('append', function(key, value) {
    return function(update) {
	if(!update.$push) {
	    update.$push = {};
	}
	update.$push[key] = value;
    };
});

ns._register('get', function(key) {
    return function(update, fields) {
	fields[key] = 1;
    };
});
