import {extractRoute, extractURI} from './utils';
import {task} from 'functional/core/Task';

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
            routeTask = cb.isTask && cb.isTask() ? cb : task(cb),
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

            return task(assign(
                {},
                this._defaults,
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