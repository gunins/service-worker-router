/**
 * Created by guntars on 25/05/2017.
 */
let parsePath = (path) => path.split('/');
class Router {
    constructor(df) {
        this._routes = [];

    };

    get(path, cb) {
        return this.addRequest(path, 'GET', cb);
    };

    post(path, cb) {
        return this.addRequest(path, 'POST', cb);
    };

    delete(path, cb) {
        return this.addRequest(path, 'DELETE', cb);
    };

    put(path, cb) {
        return this.addRequest(path, 'PUT', cb);
    };

    addRequest(path, method, cb) {
        let chunks = parsePath(path);
        let route = {
            path,
            chunks,
            method,
            cb
        };
        this._routes.push(route);
        return {
            remove(){
                this._routes.splice(this._routes.indexOf(route), 1);
            }
        }
    };


    _getRoute(options) {
        return this._routes.find(route => route.path === options.path && route.method === options.method);
    }

    trigger(options) {
        let route = this._getRoute(options);
        return new Promise((res, rej) => {
            if (route) {
                res(route.cb)
            } else {
                rej();
            }
        })
    }
}
let router = (...args) => new Router(...args);
export {Router, router}