"use strict";

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

module.exports = function(dict) {
    var re = RegExp(Object.keys(dict).map(escapeRegExp).join('|'), 'g');
    return function(str) {
	return str.replace(re, function(substr) {
	    return dict[substr];
	});
    };
};
