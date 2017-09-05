(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('functional/core/Task')) :
	typeof define === 'function' && define.amd ? define(['exports', 'functional/core/Task'], factory) :
	(factory((global.Router = global.Router || {}),global.functional_core_Task));
}(this, (function (exports,functional_core_Task) { 'use strict';

let params = {
    OPTIONAL_PARAM: /\((.*?)\)/g,
    NAMED_PARAM:    /(\(\?)?:\w+/g,
    SPLAT_PARAM:    /\*\w+/g,
    ESCAPE_PARAM:   /[\-{}\[\]+?.,\\\^$|#\s]/g
};

let parseParams = (value) => {
    try {
        return decodeURIComponent(value.replace(/\+/g, ' '));
    }
    catch (err) {
        // Failover to whatever was passed if we get junk data
        return value;
    }
};

let extractQuery = (queryString) => queryString.split('&').map(keyValue => {
    let [key, value] = keyValue.split(/=(.+)/);
    return [key, parseParams(value)]
});

let setQuery = (queryString) => extractQuery(queryString).reduce((query, arg) => {
    let [name, value] = arg;
    return Object.assign({}, query, {
        [name]: (typeof query[name] === 'string') ? [query[name], value] :
                    (Array.isArray(query[name])) ? query[name].concat([value]) : value
    });
}, {});


let preparePattern = pattern => {
    if (pattern === '') {
        return pattern.replace(/^\(\/\)/g, '').replace(/^\/|$/g, '')
    } else {
        let match = pattern.match(/^(\/|\(\/)/g);
        return match === null ? pattern[0] === '(' ? '(/' + pattern.substring(1) : '/' + pattern : pattern;
    }
};

let route = (pattern) => {
    let _route = preparePattern(pattern)
        .replace(params.ESCAPE_PARAM, '\\$&')
        .replace(params.OPTIONAL_PARAM, '(?:$1)?')
        .replace(params.NAMED_PARAM, (match, optional) => optional ? match : '([^\/]+)')
        .replace(params.SPLAT_PARAM, '(.*)');

    return new RegExp('^' + _route);
};

let extractURI = (location) => {
    let [path, query] = location.split('?', 2);
    return {
        path,
        query: query ? setQuery(query) : {}
    }
};

let extractRoute = (pattern) => {
    let match = route(pattern);
    return (loc) => {
        if (match.test(loc)) {
            let params = match.exec(loc),
                next = params.input.replace(params[0], '');
            if (next === '' || next.indexOf('/') === 0) {

                return {
                    params: params.slice(1).map((param) => param ? decodeURIComponent(param) : null).filter(a => a !== null),
                    next:   next === '' ? null : next,
                    match:  true
                }
            }
        }
        return {
            params: null,
            next:   null,
            match:  false
        };
    }

};

const router = (...args) => new Router(...args);

const _getRoute = Symbol('_getRoute');
const {assign} = Object;

class Router {
    constructor(defaults = {}) {
        this._routes = [];
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
        const {_routes} = this,
            routeTask = cb.isTask && cb.isTask() ? cb : functional_core_Task.task(cb),
            route = {
                pattern: extractRoute(path),
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
        const {next, method} = options,
            {_routes} = this,
            {query, path} = extractURI(next),
            match = _routes.find(rt => rt.method === method && rt.pattern(path).match === true);

        if (match) {
            const {routeTask, pattern} = match,
                {params, next} = pattern(path);

            return functional_core_Task.task(assign(
                {},
                this._defaults,
                options, {
                    query,
                    params,
                    next,
                    match: true
                })).map(req => ({req, resp})).through(routeTask);
        } else {
            return functional_core_Task.task(this._defaults);
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
