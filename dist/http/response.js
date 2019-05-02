(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('../lib/option')) :
	typeof define === 'function' && define.amd ? define(['exports', '../lib/option'], factory) :
	(factory((global['http/response'] = global['http/response'] || {}, global['http/response'].js = {}),global.option_js));
}(this, (function (exports,option_js) { 'use strict';

const {assign} = Object;
const NOT_FOUND = (error) => JSON.stringify({
    status:  'error',
    message: error || 'Not Found'
});

const STREAM_END = Symbol('STREAM_END');
const hasData = (_) => _ !== STREAM_END;

const response = (response, body) => option_js.option()
    .or(hasData(body), () => response.end(JSON.stringify(body)))
    .finally(() => null);

const notFound = (response, error) => assign(response, {statusCode: 404})
    .end(NOT_FOUND(error));

exports.response = response;
exports.notFound = notFound;
exports.STREAM_END = STREAM_END;

Object.defineProperty(exports, '__esModule', { value: true });

})));
