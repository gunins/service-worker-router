(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global['lib/curry'] = global['lib/curry'] || {}, global['lib/curry'].js = {})));
}(this, (function (exports) { 'use strict';

const {assign} = Object;
const pipe = (fn, ...fns) => (initial, ...args) => fns.reduce((acc, f) => f(acc, ...args), fn(initial, ...args));
const compose = (...fns) => pipe(...fns.reverse());
const pipeP = (fn, ...fns) => (initial, ...args) => fns.reduce((acc, f) => acc.then(_ => f(_, ...args)), fn(initial, ...args));
const composeP = (...fns) => pipeP(...fns.reverse());
const apply = (...fns) => (...args) => fns.map(fn => fn(...args));
const curry = (fn, ...args) => (fn.length <= args.length) ? fn(...args) : (...more) => curry(fn, ...args, ...more);
const match = (guard) => (left = _ => _, right = _ => _) => (...args) => (..._) => guard(...args) ? right(..._, ...args) : left(..._, ...args);
const extract = (_) => (...methods) => methods.reduce((acc, method) => assign(acc, {[method]: (...args) => _[method](...args)}), {});

exports.pipe = pipe;
exports.compose = compose;
exports.curry = curry;
exports.apply = apply;
exports.match = match;
exports.extract = extract;
exports.composeP = composeP;
exports.pipeP = pipeP;

Object.defineProperty(exports, '__esModule', { value: true });

})));
