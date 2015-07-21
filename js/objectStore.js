"use strict";
var INITIAL_CAPACITY = 100;

module.exports = function() {
    this._storage = Array(INITIAL_CAPACITY);
    this._nextSpot = 0;
    this._firstRecycled = -1;
};

var clazz = module.exports.prototype;

clazz.store = function(obj) {
    var id;
    if(this._firstRecycled === -1) {
	id = this._nextSpot;
	this._nextSpot += 1;
    } else {
	id = this._firstRecycled;
	this._firstRecycled = this._storage[id];
    }
    this._storage[id] = obj;
    return id;
};
clazz.fetch = function(id) {
    return this._storage[id];
};

clazz.recycle = function(id) {
    this._storage[id] = this._firstRecycled;
    this._firstRecycled = id;
};
