'use strict';

var objs = {};

if (typeof window != 'undefined') {
	objs.window = window;
	objs.navigator == navigator;
	objs.document = document;
}

function getWindow() { return objs.window; }
function getNavigator() { return objs.navigator; }
function getDocument() { return objs.document; }

exports.getWindow = getWindow;
exports.getNavigator = getNavigator;
exports.getDocument = getDocument;