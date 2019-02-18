(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('functional/core/Task')) :
	typeof define === 'function' && define.amd ? define(['exports', 'functional/core/Task'], factory) :
	(factory((global.Router = {}),global.Task));
}(this, (function (exports,Task) { 'use strict';

const lambda = () => {
};
//Option will find true statement and returning result (Call by Value)
const option = (...methods) => ({
    or(bool, left) {
        return option(...methods, {bool, left})
    },
    finally(right = lambda) {
        const {left} = methods.find(({bool}) => bool) || {};
        return left ? left() : right();
    }
});

const pipe = (fn, ...fns) => (initial, ...args) => fns.reduce((acc, f) => f(acc, ...args), fn(initial, ...args));
const compose = (...fns) => pipe(...fns.reverse());
const curry = (fn, ...args) => (fn.length <= args.length) ? fn(...args) : (...more) => curry(fn, ...args, ...more);

function __async(g){return new Promise(function(s,j){function c(a,x){try{var r=g[x?"throw":"next"](a);}catch(e){j(e);return}r.done?s(r.value):Promise.resolve(r.value).then(c,d);}function d(e){c(e,1);}c();})}

const {isArray} = Array;
const {assign: assign$2} = Object;


const prop = curry((key, obj) => (obj || {})[key]);
const assoc = curry((key, val, obj) => assign$2(isArray(obj) ? [] : {}, obj || {}, {[key]: val}));

const lens = (get, set) => ({get, set});

const view = curry((lens, obj) => lens.get(obj));
const set = curry((lens, val, obj) => lens.set(val, obj));
const setAsync = curry((lens, val, obj) =>__async(function*(){ return lens.set(yield val, obj)}()));

const over = curry((lens, fn, obj) => set(lens, fn(view(lens, obj)), obj));
const overAsync = curry((lens, fn, obj) =>__async(function*(){ return set(lens, yield fn(view(lens, obj)), obj)}()));
const setOver = curry((setterLens, getterLens, fn, obj) => set(setterLens, fn(view(getterLens, obj)), obj));
const setOverAsync = curry((setterLens, getterLens, fn, obj) =>__async(function*(){ return set(setterLens, yield fn(view(getterLens, obj)), obj)}()));

const lensProp = key => lens(prop(key), assoc(key));
const lensPath = (head, ...tail) => ({
    get(obj = {}) {
        return tail.length === 0 ? view(lensProp(head), obj) : view(lensPath(...tail), obj[head]);
    },
    set(val, obj = {}) {
        return tail.length === 0 ? set(lensProp(head), val, obj) : assoc(head, set(lensPath(...tail), val, obj[head]), obj);
    }
});

const uriParams = {
    OPTIONAL_PARAM: /\((.*?)\)/g,
    NAMED_PARAM:    /(\(\?)?:\w+/g,
    SPLAT_PARAM:    /\*\w+/g,
    ESCAPE_PARAM:   /[\-{}\[\]+?.,\\\^$|#\s]/g
};

const parseParams = (value) => {
    try {
        return decodeURIComponent(value.replace(/\+/g, ' '));
    } catch (err) {
        // Failover to whatever was passed if we get junk data
        return value;
    }
};

const extractQuery = (queryString) => queryString.split('&').map(keyValue => {
    const [key, value] = keyValue.split(/=(.+)/);
    return [key, parseParams(value)]
});

const setQuery = (queryString) => extractQuery(queryString).reduce((query, arg) => {
    const [name, value] = arg;
    return Object.assign({}, query, {
        [name]: (typeof query[name] === 'string') ? [query[name], value] :
                    (Array.isArray(query[name])) ? query[name].concat([value]) : value
    });
}, {});


const preparePattern = pattern => {
    if (pattern === '') {
        return pattern.replace(/^\(\/\)/g, '').replace(/^\/|$/g, '')
    } else {
        const match$$1 = pattern.match(/^(\/|\(\/)/g);
        return match$$1 === null ? pattern[0] === '(' ? '(/' + pattern.substring(1) : '/' + pattern : pattern;
    }
};

const route = (pattern) => {
    const _route = preparePattern(pattern)
        .replace(uriParams.ESCAPE_PARAM, '\\$&')
        .replace(uriParams.OPTIONAL_PARAM, '(?:$1)?')
        .replace(uriParams.NAMED_PARAM, (match$$1, optional) => optional ? match$$1 : '([^\/]+)')
        .replace(uriParams.SPLAT_PARAM, '(.*)');

    return new RegExp('^' + _route);
};

const extractURI = (location) => {
    const [path, query] = location.split('?', 2);
    return {
        path,
        query: query ? setQuery(query) : {}
    }
};

const hasParam = param => param !== undefined;
const decodeParams = ([head, ...tail] = []) => tail
    .reduce((acc, param) => option()
        .or(hasParam(param), () => [...acc, decodeURIComponent(param)])
        .finally(() => acc), []);

const paramsInput = view(lensPath('input'));
const paramsFirst = view(lensPath(0));

const replacePath = _ => (paramsInput(_) || '').replace(paramsFirst(_) || '', '');
const getNext = (loc, match$$1) => {
    const params = match$$1.exec(loc);
    const next = replacePath(params);
    return {
        params,
        next
    }
};

const hasNext = ({next}) => (next === '' || next.indexOf('/') === 0);
const hasMatch = (loc, match$$1) => option()
    .or(match$$1.test(loc), () => {
        const next = getNext(loc, match$$1);
        return hasNext(next) ? next : null
    })
    .finally(() => null);
const nextLink = next => next === '' ? null : next;

const nextLens = lensPath('next');
const paramsLens = lensPath('params');
const matchLens = lensPath('match');

const hasRoute = (route) => view(nextLens)(route) !== undefined;

const extractRoute = (pattern) => {
    const match$$1 = route(pattern);
    return (loc) => {
        const route = hasMatch(loc, match$$1);
        return option()
            .or(hasRoute(route), () => compose(
                over(paramsLens, decodeParams),
                over(nextLens, nextLink),
                set(matchLens, true)
            )(route))
            .finally(() => compose(
                set(matchLens, false),
                set(paramsLens, null),
                set(nextLens, null)
            )({}));
    }
};

const router = (...args) => new Router(...args);

const _getRoute = Symbol('_getRoute');
const {assign} = Object;

class Router {
    constructor(defaults = {}) {
        this._routes = [];
        const {scope} = defaults;
        Reflect.deleteProperty(defaults, 'scope');
        this._scope = scope && scope !== '' ? '/' + scope.replace(/^\/|\/$/g, '') : '';
        this._defaults = assign({match: false}, defaults);

    };

    get(path, routeTask) {
        return this.addRequest(path, 'GET', routeTask);
    };

    post(path, routeTask) {
        return this.addRequest(path, 'POST', routeTask);
    };

    delete(path, routeTask) {
        return this.addRequest(path, 'DELETE', routeTask);
    };

    put(path, routeTask) {
        return this.addRequest(path, 'PUT', routeTask);
    };

    addRequest(path, method, cb) {
        const {_routes, _scope} = this;
        const routeTask = cb.isTask && cb.isTask() ? cb : Task.task(cb);
        const route = {
            pattern: extractRoute(_scope + '/' + path.replace(/^\//g, '')),
            method,
            routeTask
        };
        _routes.push(route);
        return {
            remove() {
                _routes.splice(_routes.indexOf(route), 1);
            }
        }
    };


    [_getRoute](options, resp) {
        const {next, method} = options;
        const {_routes, _defaults} = this;
        const {query, path} = extractURI(next);
        const match = _routes.find(rt => rt.method === method && rt.pattern(path).match === true);

        if (match) {
            const {routeTask, pattern} = match,
                {params, next} = pattern(path);

            return Task.task(assign(
                {},
                _defaults,
                options, {
                    query,
                    params,
                    next,
                    match: true
                })).map(req => ({req, resp})).through(routeTask);
        } else {
            return Task.task(this._defaults);
        }

    }

    trigger(options, resp = {}) {
        return this[_getRoute](options, resp);
    }
}

exports.Router = Router;
exports.router = router;

Object.defineProperty(exports, '__esModule', { value: true });

})));
