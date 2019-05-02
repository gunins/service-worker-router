(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('functional/core/Task'), require('../lib/option')) :
	typeof define === 'function' && define.amd ? define(['exports', 'functional/core/Task', '../lib/option'], factory) :
	(factory((global['http/pipe'] = global['http/pipe'] || {}, global['http/pipe'].js = {}),global.Task,global.option_js));
}(this, (function (exports,Task,option_js) { 'use strict';

const pipe = middleWare => Task.task(({req, resp}, resolve, reject) => {
    middleWare(req, resp, (error) => option_js.option()
        .or(error, () => reject(error))
        .finally(() => resolve({req, resp})));
});

exports.pipe = pipe;

Object.defineProperty(exports, '__esModule', { value: true });

})));
