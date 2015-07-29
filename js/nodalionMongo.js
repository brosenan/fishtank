"use strict";
var $S = require('suspend'), $R = $S.resume;
var MongoClient = require('mongodb').MongoClient;

var nodalion = require('./nodalion.js');

var ns = nodalion.namespace('/nodalion', ['value']);


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
	var fields = {_id:1};
	var query = {};
	var options = {upsert: true, 
		       projection: fields};
	ops.forEach(function(op) {
	    op(update, fields, query, options);
	});
	query._id = row;
	var result;
	if(Object.keys(update).length > 0) {
	    result = yield db.collection(coll).findOneAndUpdate(query, 
								update, 
								options, $R());
	    result = result.value;
	} else {
	    result = yield db.collection(coll).findOne({_id: row}, {fields: fields}, $R());
	}
	if(result) delete result._id;
	return Object.keys(result || {}).map(function(key) {
	    return ns.value(key, result[key]);
	});
    });
});

ns._register('set', function(key, values) {
    return function(update) {
	if(!update.$set) {
	    update.$set = {};
	}
	update.$set[key] = values;
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

ns._register('check', function(key, value) {
    return function(update, fields, query, options) {
	query[key] = [value];
	options.upsert = false;
    };
});

ns._register('getAll', function() {
    return function(upsert, fields) {
	Object.keys(fields).forEach(function(key) {
	    delete fields[key];
	});
    };
});
