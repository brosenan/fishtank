"use strict";

var assert = require('assert');

var ObjectStore = require('../objectStore.js');

describe('ObjectStore', function(){
    it('should allow objects to be stored and fetched', function(){
	var store = new ObjectStore();
	var id1 = store.store({a:1});
	var id2 = store.store({a:2});
	assert.equal(store.fetch(id1).a, 1);
	assert.equal(store.fetch(id2).a, 2);
    });
    it('should allow reuse of slots through the recycle() method', function(){
	var store = new ObjectStore();
	var id1 = store.store({a:1});
	var id2 = store.store({a:2});
	store.recycle(id1);
	var id3 = store.store({a:3});
	assert.equal(id3, id1);
    });
    it('should allow multiple de-allocations', function(){
	var store = new ObjectStore();
	var id1 = store.store({a:1});
	var id2 = store.store({a:2});
	store.recycle(id1);
	store.recycle(id2);
	var id3 = store.store({a:3});
	var id4 = store.store({a:4});
	assert.equal(store.fetch(id3).a, 3);
    });

});
