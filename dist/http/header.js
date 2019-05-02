(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global['http/header'] = global['http/header'] || {}, global['http/header'].js = {})));
}(this, (function (exports) { 'use strict';

const {entries} = Object;

const addHeader = (header) => (req, resp, cb) => {
    entries(header)
        .forEach(([type, value]) => resp.setHeader(type, value));
    cb();
};

const jsonHeader = addHeader({'Content-Type': 'application/json'});
const htmlHeader = addHeader({'Content-Type': 'text/html; charset=utf-8'});

exports.addHeader = addHeader;
exports.jsonHeader = jsonHeader;
exports.htmlHeader = htmlHeader;

Object.defineProperty(exports, '__esModule', { value: true });

})));
