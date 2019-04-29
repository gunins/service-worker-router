import {extractRoute, extractURI} from './utils';
import {task} from 'functional/core/Task';
import {option} from './lib/option';
import {curry} from './lib/curry';

const router = (...args) => new Router(...args);

const {assign} = Object;
const assignTo = (..._) => assign({}, ..._);

const hasMethod = (matchedMethod, path, {method, pattern}) => method === matchedMethod && pattern(path).match === true;
const findRoutes = (method, path, _routes) => _routes.find(_ => hasMethod(method, path, _));

const hasScope = (scope) => scope && scope !== '';
const setScope = (scope) => option()
    .or(hasScope(scope), () => '/' + scope.replace(/^\/|\/$/g, ''))
    .finally(() => '');

const registerRoute = curry((route, context) => {
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
const getRoute = (route) => option().or(hasRoute(route), () => route.route()).finally(() => route);

const setTask = (_) => _.isTask && _.isTask() ? _ : task(_);

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
    return task(taskParams)
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
        const pattern = extractRoute(fullPath);
        const routeTask = setTask(cb);

        return registerRoute({
            pattern,
            method,
            routeTask
        })(this);
    };


    [_getRoute](options, resp) {
        const {next, method} = options;
        const {query, path} = extractURI(next);
        const {[_routes]: routes, [_defaults]: defaults} = this;
        const match = findRoutes(method, path, routes);
        return option()
            .or(match, () => setRoute(match, path, query, resp, options, defaults))
            .finally(() => task(defaults))
    }

    trigger(options, resp = {}) {
        return this[_getRoute](options, resp);
    }

    static merge(head, ...tail) {
        const routes = [head, ...tail].reduce((acc, router) => [...acc, ...router[_routes]], []);
        return router(head[_defaults], routes);
    }
}

export {Router, router}
