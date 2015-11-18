"use strict";
var express = require('express');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };

var Nodalion = require('./nodalion.js');
var ns = Nodalion.namespace('/nodalion', ['serveHandlers']);

var setupRouter = $S.async(function*(router, nodalion, app) {
    var Path = {var:'Path'};
    var Handlers = {var:'Handlers'};
    var locations = yield nodalion.findAll([Path, Handlers], ns.serveHandlers(app, Path, Handlers), $R());
    locations.forEach(function(loc) {
	router.get(loc[0], loc[1]);
    });
});

exports.app = function(nodalion, app) {
    var router = express.Router();
    setupRouter(router, nodalion, app, function(err) {
	if(err) {
	    console.error(err);
	}
    });
    return router;
};

ns._register('outputText', function(contentType, text) {
    return function(req, res) {
	res.set('Content-Type', contentType);
	res.send(text);
    };
});

ns._register('outputJson', function(json) {
    return function(req, res) {
	res.set('Content-Type', 'application/json');
	res.send(JSON.stringify(json));
    };
});

function id(x) { return x; }

ns._register('jsonStr', id);
ns._register('jsonList', id);
ns._register('jsonNum', id);
ns._register('jsonObj', function(fields) {
    var obj = Object.create(null);
    fields.forEach(function(field) {
	field(obj);
    });
    return obj;
});
ns._register('field', function(name, value) {
    return function(obj) {
	obj[name] = value;
    };
});
