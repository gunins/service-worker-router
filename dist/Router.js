(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('./utils'), require('functional_tasks'), require('./lib/option'), require('./lib/curry')) :
	typeof define === 'function' && define.amd ? define(['exports', './utils', 'functional_tasks', './lib/option', './lib/curry'], factory) :
	(factory((global.Router = global.Router || {}, global.Router.js = {}),global.utils_js,global.functional_tasks,global.option_js,global.curry_js));
}(this, (function (exports,utils_js,functional_tasks,option_js,curry_js) { 'use strict';

const router = (...args) => new Router(...args);

const {assign} = Object;
const assignTo = (..._) => assign({}, ..._);

const hasMethod = (matchedMethod, path, {method, pattern}) => method === matchedMethod && pattern(path).match === true;
const findRoutes = (method, path, _routes) => _routes.find(_ => hasMethod(method, path, _));

const hasScope = (scope) => scope && scope !== '';
const setScope = (scope) => option_js.option()
    .or(hasScope(scope), () => '/' + scope.replace(/^\/|\/$/g, ''))
    .finally(() => '');

const registerRoute = curry_js.curry((route, context) => {
    const {[_routes]: routes} = context;
    context[_routes] = [...routes, route];
    return {
        remove() {
            context[_routes] = context[_routes].filter(_ => route !== _);
        },
        route() {
            return route;
        }
    }
});

const hasRoute = (route) => route && route.route;
const getRoute = (route) => option_js.option().or(hasRoute(route), () => route.route()).finally(() => route);

const setTask = (_) => _.isTask && _.isTask() ? _ : functional_tasks.task(_);

const setRoute = (match, path, query, resp, options, defaults) => {
    const {routeTask, pattern} = match;
    const {params, next} = pattern(path);
    const currentParams = {
        query,
        params,
        next,
        match: true
    };
    const taskParams = assignTo(
        defaults,
        options,
        currentParams
    );
    return functional_tasks.task(taskParams)
        .map(req => ({req, resp}))
        .through(routeTask);
};

const _getRoute = Symbol('_getRoute');
const _routes = Symbol('_routes');
const _scope = Symbol('_scope');
const _defaults = Symbol('_defaults');

class Router {
    constructor(defaults = {}, routes = []) {
        this[_routes] = routes;
        const {scope} = defaults;
        Reflect.deleteProperty(defaults, 'scope');
        this[_scope] = setScope(scope);
        this[_defaults] = assign({match: false}, defaults);

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

    copy() {
        return router(assign({match: false}, this[_defaults]), [...this[_routes]]);
    }

    removeRoute(route) {
        const target = getRoute(route);
        this[_routes] = this[_routes].filter(_ => target !== _);
    };

    RemoveAll() {
        this[_routes] = [];
    };


    addRequest(path, method, cb) {
        const fullPath = this[_scope] + '/' + path.replace(/^\//g, '');
        const pattern = utils_js.extractRoute(fullPath);
        const routeTask = setTask(cb);

        return registerRoute({
            pattern,
            method,
            routeTask
        })(this);
    };


    [_getRoute](options, resp) {
        const {next, method} = options;
        const {query, path} = utils_js.extractURI(next);
        const {[_routes]: routes, [_defaults]: defaults} = this;
        const match = findRoutes(method, path, routes);
        return option_js.option()
            .or(match, () => setRoute(match, path, query, resp, options, defaults))
            .finally(() => functional_tasks.task(defaults))
    }

    trigger(options, resp = {}) {
        return this[_getRoute](options, resp);
    }

    static merge(head, ...tail) {
        const routes = [head, ...tail].reduce((acc, router) => [...acc, ...router[_routes]], []);
        return router(head[_defaults], routes);
    }
}

exports.Router = Router;
exports.router = router;

Object.defineProperty(exports, '__esModule', { value: true });

})));
