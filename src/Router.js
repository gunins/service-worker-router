import {extractRoute, extractURI} from './utils';
import {task} from 'functional/core/Task';

let router = (...args) => new Router(...args);
class Router {
    constructor(defaults = {}) {
        this._routes = [];
        this._defaults = Object.assign({match: false}, defaults);

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
        let {_routes} = this,
            routeTask = cb.isTask && cb.isTask() ? cb : task(cb),
            route = {
                pattern: extractRoute(path),
                method,
                routeTask
            };
        _routes.push(route);
        return {
            remove(){
                _routes.splice(_routes.indexOf(route), 1);
            }
        }
    };


    _getRoute(options) {
        let {next, method, body} = options,
            {_routes} = this,
            {query, path} = extractURI(next),
            match = _routes.find(rt => rt.method === method && rt.pattern(path).match === true);

        if (match) {
            let {routeTask, pattern} = match,
                {params, next} = pattern(path);
            return task(Object.assign({}, this._defaults, {
                query,
                params,
                method,
                next,
                body,
                match: true
            })).through(routeTask);
        } else {
            return task(this._defaults);
        }

    }

    trigger(options) {
        return this._getRoute(options);
    }
}
export {Router, router}