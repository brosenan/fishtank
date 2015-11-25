"use strict";
var express = require('express');
var $S = require('suspend'), $R = $S.resume, $RR = $S.resumeRaw, $T = function(gen) { return function(done) { $S.run(gen, done); } };
var ipfs = require('ipfs-client');
var bodyParser = require('body-parser');

var Nodalion = require('./nodalion.js');
var ns = Nodalion.namespace('/nodalion', ['serveHandlers', 'bind']);

var setupRouter = $S.async(function*(router, nodalion, app) {
    var Method = {var:'Method'};
    var Path = {var:'Path'};
    var Handlers = {var:'Handlers'};
    var locations = yield nodalion.findAll([Method, Path, Handlers], ns.serveHandlers(app, Method, Path, Handlers), $R());
    locations.forEach(function(loc) {
	loc = loc.meaning();
	var method = loc[0].name.split('#')[1];
	router[method](loc[1], loc[2].meaning().map(handler => handler.meaning()));
    });
});

exports.app = function(nodalion, app) {
    var router = express.Router();
    router.use(function(req, res, next) {
	req.nodalion = nodalion;
	next();
    });
    setupRouter(router, nodalion, app, function(err) {
	if(err) {
	    console.error(err);
	}
    });
    return router;
};

exports.jsonToTerm = function(json) {
    if(typeof json === 'object') {
	if(Array.isArray(json)) {
	    return ns.jsonList(json.map(exports.jsonToTerm));
	} else {
	    return ns.jsonObj(Object.keys(json).map(key => ns.field(key, exports.jsonToTerm(json[key]))));
	}
    } else if(typeof json === 'string') {
	return ns.jsonStr(json);
    } else if(typeof json === 'number') {
	return ns.jsonNum(json);
    } else {
	throw Error('unsupported JSON value: ' + JSON.stringify(json));
    }
};

ns._register('outputText', function(contentType, text) {
    return function(req, res) {
	res.set('Content-Type', contentType);
	res.send(text);
    };
});

ns._register('outputJson', function(json) {
    return function(req, res) {
	res.json(json.meaning());
    };
});

function id(x) { return x; }

ns._register('jsonStr', id);
ns._register('jsonList', term => term.meaning().map(elem => elem.meaning()));
ns._register('jsonNum', id);
ns._register('jsonObj', function(fields) {
    var obj = Object.create(null);
    fields.meaning().forEach(field => {field.meaning()(obj);});
    return obj;
});
ns._register('field', function(name, value) {
    return function(obj) {
	obj[name] = value.meaning();
    };
});

// Taken from http://stackoverflow.com/questions/11709865/nodejs-express-connect-dynamically-add-middleware-in-current-flow
var walkSubstack = function (stack, req, res, next) {

  if (typeof stack === 'function') {
    stack = [stack];
  }

  var walkStack = function (i, err) {

    if (err) {
      return next(err);
    }

    if (i >= stack.length) {
      return next();
    }

    stack[i](req, res, walkStack.bind(null, i + 1));

  };

  walkStack(0);

};


ns._register('with', function(Ctx, Impred, Handlers) {
    return $S(function*(req, res, next) {
	var ctxValue = Object.create(null);
	if(!Ctx.name || Ctx.name !== '/nodalion#jsonObj') {
	    throw Error("Expected JSON term: " + Ctx.toString());
	}
	var fieldList = Ctx.args[0].meaning();
	var collect = fieldList.map(field => field.args[0]);
	collect.forEach(key => {ctxValue[key] = req[key];});
	ctxValue = exports.jsonToTerm(ctxValue);
	var handlers = yield req.nodalion.findAll(Handlers, ns.bind(ctxValue, Ctx, {var:'T'}, Impred), $R());
	if(handlers.length != 1) {
	    throw Error('Got ' + handlers.length + ' solutions for with-where handler');
	}
	handlers = handlers[0].meaning().map(elem => elem.meaning());
	walkSubstack(handlers, req, res, next);
    });
});

ns._register('header', function(Name, Value) {
    return function(req, res, next) {
	res.set(Name, Value);
	next();
    };
});

ns._register('ipfsCat', function(hash) {
    return function(req, res, next) {
	ipfs.cat(hash).pipe(res);
    };
});

ns._register('ipfsBody', function() {
    return function(req, res, next) {
	ipfs.add(req, function(err, hash) {
	    if(err) return next(err);
	    req.body = hash;
	    next();
	});
    };
});

ns._register('jsonBody', function() {
    return bodyParser.json();
});
ns._register('textBody', function() {
    return bodyParser.text();
});
