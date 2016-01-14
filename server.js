"use strict";
var MONGODB_URL = process.env.MONGODB_URL || 'mongodb://mongo:27017/cloudlog';
var AMQP_URL = process.env.AMQP_URL || 'amqp://rabbitmq';
var HTTP_PORT = process.env.HTTP_PORT || 80;
var LOGIC_LOGFILE = process.env.LOGIC_LOGFILE || '/tmp/server-logic.log';
var OBSTORE_CONFIG = (process.env.OBSTORE_CONFIG && JSON.parse(process.env.OBSTORE_CONFIG)) || {
    provider: 'filesystem',
    root: '/var/lib/storage',
    container: 'cloudlog',
};

var express = require('express');
var morgan = require('morgan');

var Nodalion = require('nodalion');
var nodalionMongo = require('nodalion-mongo');
var nodalionHttp = require('nodalion-http');
var workQueue = require('nodalion-amqp');
require('nodalion-objstore').configure(OBSTORE_CONFIG);

var ns = Nodalion.namespace('/nodalion', ['defaultQueueDomain']);
var cl1 = Nodalion.namespace('/cl1', ['cl1']);
nodalionMongo.db(MONGODB_URL);

var nodalion = new Nodalion(__dirname + '/cl1.cedimg', LOGIC_LOGFILE);

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
