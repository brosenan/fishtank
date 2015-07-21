"use strict";
var http = require('http');
var URL = require('url');

var Nodalion = require('./nodalion.js');

var ns = Nodalion.namespace('/nodalion', ['serveHttp', 'get', 'url', 'queryPair']);

ns._register('stringContent', function(type, content) {
    return function(res) {
	res.writeHead(200, {'content-type': 'text/' + type});
	res.end(content);
    };
});

function urlTerm(req) {
    var domain = req.headers.host;
    var parsedUrl = URL.parse(req.url);
    var path = parsedUrl.pathname.split('/').slice(1);
    var search = parsedUrl.query || '';
    var query = search.split('&')
	.filter(function(pair) { return pair !== ''; })
	.map(function(pair) { return pair.split('='); })
	.map(function(pair) { return ns.queryPair(pair[0], pair[1]); });
    return ns.url('http', domain, path, query);
}

exports.server = function(nodalion, name, port, addr) {
    addr = addr || '127.0.0.1';
    http.createServer(function (req, res) {
	var Src = {var:'Src'};
	nodalion.findAll(Src, ns.serveHttp(name, ns.get(), urlTerm(req), 0, Src), function(err, sources) {
	    try {
		if(err) {
		    throw err;
		}
		if(sources.length !== 1) {
		    res.writeHead(404, {'Content-Type': 'text/plain'});
		    res.end('Not Found');
		    return;
		}
		sources[0](res);
	    } catch(e) {
		res.writeHead(500, {'Content-Type': 'text/plain'});
		res.end(e.stack);
	    }
	});
    }).listen(port, addr);
};
