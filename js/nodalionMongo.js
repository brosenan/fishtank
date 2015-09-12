"use strict";
var $S = require('suspend'), $R = $S.resume;
var MongoClient = require('mongodb').MongoClient;

var Nodalion = require('./nodalion.js');
var serializeTerm = require('./serializeTerm.js');

var ns = Nodalion.namespace('/nodalion', ['value']);


var _db;
var dbListeners = [];
var _nodalion;
var _namesArr = [];
var _namesMap = {};

function getDB(nodalion, cb) {
    if(_db) {
	if(_namesArr.length == 0) {
	    updateNameMap(_db, nodalion, function(err) {
		cb(err, _db);
	    });
	} else {
	    return cb(undefined, _db);
	}
    } else {
	_nodalion = nodalion;
	dbListeners.push(cb);
    }
}

var updateNameMap = $S.async(function*(db, nodalion) {
    var namesDoc = yield db.collection('names').findOne({_id: 'names'}, $R());
    if(namesDoc) {
	_namesArr = namesDoc.namesArr;
    }
    var oldLen = _namesArr.length;
    _namesArr.forEach(function(name, i) {
	_namesMap[name] = i;
    });
    yield serializeTerm.updateNameDict(nodalion, _namesMap, _namesArr, $R());
    if(_namesArr.length > oldLen) {
	yield db.collection('names').replaceOne({_id: 'names'}, {namesArr: _namesArr}, {upsert: true}, $R());
    }
});

exports.db = function(url) {
    MongoClient.connect(url, function(err, db) {
	_db = db;
	if(_nodalion) {
	    updateNameMap(db, _nodalion, function(err) {
		console.log(err);
		dbListeners.forEach(function(listener) {
		    listener(err, db);
		});
	    });
	}
    });
};

ns._register('trans', function(coll, row, ops) {
    return function(nodalion, cb) {
	$S.async(function*(nodalion) {
	    var db = yield getDB(nodalion, $R());
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
	    return [].concat.apply([], Object.keys(result || {}).map(function(family) {
		return Object.keys(result[family]).map(function(key) {
		    return ns.value(family, key, result[family][key]);
		});
	    }));
	})(nodalion, cb);
    };
});

ns._register('set', function(family, key, values) {
    return function(update) {
	if(!update.$set) {
	    update.$set = {};
	}
	update.$set[family + '.' + key] = values;
    };
});

ns._register('append', function(family, key, value) {
    return function(update) {
	if(!update.$push) {
	    update.$push = {};
	}
	update.$push[family + '.' + key] = value;
    };
});

ns._register('get', function(family, key) {
    return function(update, fields) {
	fields[family + '.' + key] = 1;
    };
});

ns._register('check', function(family, key, value) {
    return function(update, fields, query, options) {
	query[family + '.' + key] = [value];
	options.upsert = false;
    };
});

ns._register('getAll', function(family) {
    return function(upsert, fields) {
	fields[family] = 1;
    };
});
