import {extractRoute, extractURI} from './utils';
import {task} from 'functional/core/Task';

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
        const routeTask = cb.isTask && cb.isTask() ? cb : task(cb);
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

            return task(assign(
                {},
                _defaults,
                options, {
                    query,
                    params,
                    next,
                    match: true
                })).map(req => ({req, resp})).through(routeTask);
        } else {
            return task(this._defaults);
        }

    }

    trigger(options, resp = {}) {
        return this[_getRoute](options, resp);
    }
}

export {Router, router}