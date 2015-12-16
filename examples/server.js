"use strict";
var MONGODB_URL = 'mongodb://127.0.0.1:27017/cloudlog';
var AMQP_URL = 'amqp://localhost';
var HTTP_PORT = 8080;
var LOGIC_LOGFILE = '/tmp/server-logic.log';

var express = require('express');
var morgan = require('morgan');

var Nodalion = require('../js/nodalion.js');
var nodalionMongo = require('../js/nodalionMongo.js');
var nodalionHttp = require('../js/http.js');
var workQueue = require('../js/workQueue.js');
require('../js/ipfs.js');

var ns = Nodalion.namespace('/nodalion', ['defaultQueueDomain']);
var cl1 = Nodalion.namespace('/cl1', ['cl1']);
nodalionMongo.db(MONGODB_URL);

var nodalion = new Nodalion(LOGIC_LOGFILE);

workQueue.connect(nodalion, AMQP_URL, ns.defaultQueueDomain());

var app = express();
app.use(morgan('combined'))
app.use(nodalionHttp.app(nodalion, cl1.cl1()));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Unknown Error');
});
app.listen(HTTP_PORT);
console.log("Server listening on port " + HTTP_PORT);
