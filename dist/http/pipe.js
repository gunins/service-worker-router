(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('functional_tasks'), require('../lib/option')) :
	typeof define === 'function' && define.amd ? define(['exports', 'functional_tasks', '../lib/option'], factory) :
	(factory((global['http/pipe'] = global['http/pipe'] || {}, global['http/pipe'].js = {}),global.functional_tasks,global.option_js));
}(this, (function (exports,functional_tasks,option_js) { 'use strict';

const pipe = middleWare => functional_tasks.task(({req, resp}, resolve, reject) => {
    middleWare(req, resp, (error) => option_js.option()
        .or(error, () => reject(error))
        .finally(() => resolve({req, resp})));
});

exports.pipe = pipe;

Object.defineProperty(exports, '__esModule', { value: true });

})));
