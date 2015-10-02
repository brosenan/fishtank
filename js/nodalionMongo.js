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
    var namesDoc = yield db.collection('_names').findOne({_id: 'names'}, $R());
    if(namesDoc) {
	_namesArr = namesDoc.namesArr;
    }
    var oldLen = _namesArr.length;
    _namesArr.forEach(function(name, i) {
	_namesMap[name] = i;
    });
    yield serializeTerm.updateNameDict(nodalion, _namesMap, _namesArr, $R());
    if(_namesArr.length > oldLen) {
	yield db.collection('_names').replaceOne({_id: 'names'}, {namesArr: _namesArr}, {upsert: true}, $R());
    }
});

function encode(term) {
    return serializeTerm.encodeTerm(term, _namesMap);
}

function decode(b64) {
    return serializeTerm.decodeTerm(b64, _namesArr);
}

exports.db = function(url) {
    MongoClient.connect(url, function(err, db) {
	_db = db;
	if(_nodalion) {
	    updateNameMap(db, _nodalion, function(err) {
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
	    var postProcessing = [];
	    ops.forEach(function(op) {
		op(update, fields, query, options, postProcessing);
	    });
	    query._id = encode(row);
	    var result;
	    if(Object.keys(update).length > 0) {
		result = yield db.collection(coll).findOneAndUpdate(query, 
								    update, 
								    options, $R());
		result = result.value;
	    } else {
		result = yield db.collection(coll).findOne({_id: encode(row)}, {fields: fields}, $R());
	    }
	    if(result) {
		delete result._id;
	    } else {
		result = Object.create(null);
	    }
	    postProcessing.forEach(function(post) {
		post(result);
	    });
	    return [].concat.apply([], Object.keys(result || {}).map(function(family) {
		return Object.keys(result[family]).map(function(key) {
		    return ns.value(family, decode(key), result[family][key].map(decode));
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
	update.$set[family + '.' + encode(key)] = values.map(encode);
    };
});

ns._register('append', function(family, key, value) {
    return function(update) {
	if(!update.$push) {
	    update.$push = {};
	}
	update.$push[family + '.' + encode(key)] = encode(value);
    };
});

ns._register('get', function(family, key) {
    return function(update, fields, query, options, postProcessing) {
	key = encode(key);
	fields[family + '.' + key] = 1;
	postProcessing.push(function(res) {
	    if(!(family in res)) {
		res[family] = {};
	    }
	    if(!(key in res[family])) {
		res[family][key] = [];
	    }
	});
    };
});

ns._register('check', function(family, key, value) {
    return function(update, fields, query, options) {
	query[family + '.' + encode(key)] = value.map(encode);
	options.upsert = false;
    };
});

ns._register('getAll', function(family) {
    return function(upsert, fields) {
	fields[family] = 1;
    };
});
