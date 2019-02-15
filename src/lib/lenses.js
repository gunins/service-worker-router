import {curry} from './curry';

const {isArray} = Array;
const {assign} = Object;


const prop = curry((key, obj) => (obj || {})[key]);
const assoc = curry((key, val, obj) => assign(isArray(obj) ? [] : {}, obj || {}, {[key]: val}));

const lens = (get, set) => ({get, set});

const view = curry((lens, obj) => lens.get(obj));
const set = curry((lens, val, obj) => lens.set(val, obj));
const setAsync = curry(async (lens, val, obj) => lens.set(await val, obj));

const over = curry((lens, fn, obj) => set(lens, fn(view(lens, obj)), obj));
const overAsync = curry(async (lens, fn, obj) => set(lens, await fn(view(lens, obj)), obj));
const setOver = curry((setterLens, getterLens, fn, obj) => set(setterLens, fn(view(getterLens, obj)), obj));
const setOverAsync = curry(async (setterLens, getterLens, fn, obj) => set(setterLens, await fn(view(getterLens, obj)), obj));

const fromTo = (setter, getter) => curry((to, from) => set(setter, view(getter, from), to));


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

export {prop, assoc, lens, view, set, setAsync, over, setOver, overAsync, setOverAsync, lensProp, lensPath, nullLens, fromTo}
