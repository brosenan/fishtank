"use strict";

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

module.exports = function(dict) {
    var keys = Object.keys(dict);
    if(keys.length == 0) {
	return function(str) { return str; };
    }
    var re = RegExp(keys.map(escapeRegExp).join('|'), 'g');
    return function(str) {
	return str.replace(re, function(substr) {
	    return dict[substr];
	});
    };
};
