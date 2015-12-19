var fs = require('fs');
var EventEmitter = require('events').EventEmitter;

var dataDir = '/tmp';

exports.add = function(stream, cb) {
    var hash = Math.floor(Math.random() * 1000000000) + '';
    var output = fs.createWriteStream(dataDir + '/' + hash);
    stream.on('end', () => { cb(undefined, hash); });
    output.on('error', cb);
    stream.pipe(output);
};
exports.cat = function(hash) {
    return fs.createReadStream(dataDir + '/' + hash);
};

exports.addString = function(str, cb) {
    var stream = new EventEmitter();
    stream.pipe = file => {
	file.write(str);
	file.end();
	stream.emit('end');
    };
    exports.add(stream, cb);
};

exports.getString = function(hash, cb) {
    var str = '';
    var stream = exports.cat(hash);
    stream.on('data', data => {str += data;});
    stream.on('end', () => {cb(undefined, str);});
    stream.on('error', cb);
};
