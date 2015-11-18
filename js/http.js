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















