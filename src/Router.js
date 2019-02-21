import {extractRoute, extractURI} from './utils';
import {task} from 'functional/core/Task';
import {option} from './lib/option';

const router = (...args) => new Router(...args);

const {assign} = Object;

const hasMethod = (matchedMethod, path, {method, pattern}) => method === matchedMethod && pattern(path).match === true;
const findRoutes = (method, path, _routes) => _routes.find(_ => hasMethod(method, path, _));

const hasScope = (scope) => scope && scope !== '';
const setScope = (scope) => option()
    .or(hasScope(scope), () => '/' + scope.replace(/^\/|\/$/g, ''))
    .finally(() => '');

const registerRoute = (route, context) => {
    const {[_routes]: routes} = context;
    context[_routes] = [...routes, route];
    return {
        remove() {
            context[_routes] = routes.filter(_ => route !== _);
        }
    }
};

const _getRoute = Symbol('_getRoute');
const _routes = Symbol('_routes');
const _scope = Symbol('_scope');
const _defaults = Symbol('_defaults');

class Router {
    constructor(defaults = {}) {
        this[_routes] = [];
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


    addRequest(path, method, cb) {
        const {[_scope]: scope} = this;
        const routeTask = cb.isTask && cb.isTask() ? cb : task(cb);
        const fullPath = scope + '/' + path.replace(/^\//g, '')
        const route = {
            pattern: extractRoute(fullPath),
            method,
            routeTask
        };
        return registerRoute(route, this);
    };


    [_getRoute](options, resp) {
        const {next, method} = options;
        const {query, path} = extractURI(next);
        const {[_routes]: routes, [_defaults]: defaults} = this;
        const match = findRoutes(method, path, routes);
        return option()
            .or(match, () => {
                const {routeTask, pattern} = match;
                const {params, next} = pattern(path);
                const currentParams = {
                    query,
                    params,
                    next,
                    match: true
                };

                return task(assign(
                    {},
                    defaults,
                    options,
                    currentParams
                ))
                    .map(req => ({req, resp}))
                    .through(routeTask);
            })
            .finally(() => task(defaults))
    }

    trigger(options, resp = {}) {
        return this[_getRoute](options, resp);
    }
}

export {Router, router}
