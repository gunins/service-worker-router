(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('./curry')) :
	typeof define === 'function' && define.amd ? define(['exports', './curry'], factory) :
	(factory((global['lib/lenses'] = global['lib/lenses'] || {}, global['lib/lenses'].js = {}),global.curry_js));
}(this, (function (exports,curry_js) { 'use strict';

const {isArray} = Array;
const {assign} = Object;


const prop = curry_js.curry((key, obj) => (obj || {})[key]);
const assoc = curry_js.curry((key, val, obj) => assign(isArray(obj) ? [] : {}, obj || {}, {[key]: val}));

const lens = (get, set) => ({get, set});

const view = curry_js.curry((lens, obj) => lens.get(obj));
const set = curry_js.curry((lens, val, obj) => lens.set(val, obj));
const setAsync = curry_js.curry(async (lens, val, obj) => lens.set(await val, obj));

const over = curry_js.curry((lens, fn, obj) => set(lens, fn(view(lens, obj)), obj));
const overAsync = curry_js.curry(async (lens, fn, obj) => set(lens, await fn(view(lens, obj)), obj));
const setOver = curry_js.curry((setterLens, getterLens, fn, obj) => set(setterLens, fn(view(getterLens, obj)), obj));
const setOverAsync = curry_js.curry(async (setterLens, getterLens, fn, obj) => set(setterLens, await fn(view(getterLens, obj)), obj));

const fromTo = (setter, getter) => curry_js.curry((to, from) => set(setter, view(getter, from), to));


const lensProp = key => lens(prop(key), assoc(key));
const lensPath = (head, ...tail) => ({
    get(obj = {}) {
        return tail.length === 0 ? view(lensProp(head), obj) : view(lensPath(...tail), obj[head]);
    },
    set(val, obj = {}) {
        return tail.length === 0 ? set(lensProp(head), val, obj) : assoc(head, set(lensPath(...tail), val, obj[head]), obj);
    }
});
const nullLens = ({
    get() {
    },
    set() {
    }
});

exports.prop = prop;
exports.assoc = assoc;
exports.lens = lens;
exports.view = view;
exports.set = set;
exports.setAsync = setAsync;
exports.over = over;
exports.setOver = setOver;
exports.overAsync = overAsync;
exports.setOverAsync = setOverAsync;
exports.lensProp = lensProp;
exports.lensPath = lensPath;
exports.nullLens = nullLens;
exports.fromTo = fromTo;

Object.defineProperty(exports, '__esModule', { value: true });

})));
