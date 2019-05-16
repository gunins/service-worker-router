'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var http = _interopDefault(require('http'));
var morgan = _interopDefault(require('morgan'));
var bodyParser = _interopDefault(require('body-parser'));
var fs = require('fs');

const some = (value) => new Some(value);
const none = () => new None();

class Some {
    constructor(value) {
        this.value = value;
    };

    isSome() {
        return ['[object Some]'].indexOf(this.toString()) !== -1
    };

    isOption() {
        return ['[object Some]', '[object None]'].indexOf(this.toString()) !== -1;
    }

    get() {
        return this.value;
    };

    map(fn) {
        return this.isSome() ? some(fn(this.get())) : none();
    };

    flatMap(fn) {
        const out = fn(this.get());
        if (out.isOption) {
            return out;
        }else{
            throw new ReferenceError('Must return an Option');
        }

    }

    set(value) {
        return some(value);
    };

    isEmpty() {
        return this.value ? false : true;
    };

    getOrElse(defaultVal) {
        return this.isSome() ? this.value : defaultVal
    };

    getOrElseLazy(defaultVal=()=>{}) {
        return this.isSome() ? this.value : defaultVal()
    };

    toString() {
        return '[object Some]';
    };
}

class None extends Some {
    constructor() {
        super();
    };

    isSome() {
        return false;
    };

    set(value) {
        return none();
    };

    toString() {
        return '[object None]';
    };

}

//Define Private methods;
const _create$1 = Symbol('_create');
const _reverse = Symbol('_reverse');
const _map = Symbol('_map');
const _take = Symbol('_take');
const _flatMap$1 = Symbol('_flatMap');
const _filter = Symbol('_filter');

const hasTail = (tail) => tail && tail.isList && tail.isList();
const hasHead = (head) => head && head.isSome && head.isSome();
const noTail = (tail) => tail && tail.isSome && !tail.isSome();
const tailHasSize = (tail) => hasTail(tail) && hasHead(tail.head);

const flatList = (left, list) => list
    .foldLeft(left, (_, record) => _.insert(record));

class List {
    constructor(head, ...tail) {
        // split the head and tail pass to new list
        this[_create$1](head, tail.length > 0 ? list(...tail) : none());
    };

    //Private Method
    [_create$1](head, tail) {
        this.head = head !== undefined ? some(head) : none();
        this.tail = tailHasSize(tail) ? tail : none();
        return this;
    };

    //Private Method
    [_reverse](list) {
        const {head, tail} = this;
        if (head.isSome()) {
            const insert = list.insert(head.get());
            if (noTail(tail)) {
                return insert;
            } else {
                return tail[_reverse](insert);
            }
        } else {
            return list;
        }
    };

    //private method
    [_map](fn, i = 0) {
        const {head, tail} = this;
        const empty = List.empty();
        return hasHead(head) ? empty[_create$1](fn(head.get(), i), noTail(tail) ? none() : tail[_map](fn, i + 1)) : empty;
    };

    //private method
    [_take](count, i = 1) {
        const {head, tail} = this;
        const empty = List.empty();
        return hasHead(head) ? empty[_create$1](head.get(), (noTail(tail)) || count <= i ? none() : tail[_take](count, i + 1)) : empty;
    }

    //private method
    [_flatMap$1](fn, i = 0) {
        const {head, tail} = this;
        const list = hasHead(head) ? fn(head.get(), i) : List.empty();
        return noTail(tail) ? list : list.concat(tail[_flatMap$1](fn, i));

    };

    //private method
    [_filter](fn, list = List.empty()) {
        const {head, tail} = this;
        const value = head.get();
        const comparison = fn(value);
        const outList = comparison ? list.insert(value) : list;
        return tail.isList && tail.isList() ? tail[_filter](fn, outList) : outList.reverse();
    }

    getOrElse(fn) {
        return this.size() > 0 ? this.map(a => a) : list(fn())
    };

    insert(head) {
        return List.empty()[_create$1](head, this.head ? this : none());
    }

    add(head) {
        return this.reverse().insert(head).reverse();
    }

    copy() {
        return this.map(a => a);
    };

    concat(...lists) {
        const listArray = [this, ...lists];
        return listArray
            .reduce(flatList, List.empty())
            .reverse();
    };

    reverse() {
        const {head} = this;
        const empty = List.empty();
        if (!head.isSome()) {
            return empty;
        } else {
            return this[_reverse](empty);
        }

    };


    foldLeft(a, fn) {
        const func = fn || a;
        const initialValue = fn ? a : undefined;
        const {head, tail} = this;
        if (!head.isSome()) {
            return initialValue;
        } else if (head.isSome() && noTail(tail)) {
            return func(initialValue, head.get());
        } else {
            return tail.foldLeft(func(initialValue, head.get()), func)
        }
    }

    foldRight(a, fn) {
        return this
            .reverse()
            .foldLeft(a, fn);
    };

    find(fn) {
        const {head, tail} = this;
        const value = head.get();
        const comparison = fn(value);
        return comparison ? value : hasTail(tail) ? tail.find(fn) : none();
    };


    filter(fn) {
        return this[_filter](fn);
    };

    map(fn) {
        return this[_map](fn);
    };

    forEach(fn) {
        return this.map(item => {
            fn(item);
            return item;
        })

    }

    flatMap(fn) {
        return this[_flatMap$1](fn);
    };

    size() {
        return this.foldLeft(0, _ => ++_);
    };

    take(count) {
        return this[_take](count);
    };

    toString() {
        return '[object List]'
    };

    isList() {
        return this.toString() === '[object List]';
    };

    toArray() {
        return this.foldLeft([], (_, value) => [..._, value]);
    }

    static empty() {
        return list();
    }


}

const list = (...fns) => new List(...fns);

const {assign, keys} = Object;

const pair = (guard, action) => ({guard, action});

// map method for Objects
const objCopy = (obj, fn) => keys(obj).reduce((initial, attr) => assign(initial, {[attr]: fn(obj[attr])}), {});

const isDate = (obj) => Object.prototype.toString.call(obj) === '[object Date]';
const isArray = (obj) => Object.prototype.toString.call(obj) === '[object Array]';
const isObject = (obj) => (!!obj) && (obj.constructor === Object);
const isOther = (obj) => !isDate(obj) && !isArray(obj) && !isObject(obj);

// Cloning actions, for different types
//All imutable references returning same instance
const cloneSimple = (simple) => () => simple;
const cloneDate = (date) => () => new Date(date.getTime());
const cloneArray = (arr) => (fn) => arr.map(fn);
const cloneObj = (obj) => (fn) => objCopy(obj, fn);

// Define functors, with guards and actions
const arrayFunctor = pair(isArray, cloneArray);
const dateFunctor = pair(isDate, cloneDate);
const objectFunctor = pair(isObject, cloneObj);
const otherFunctor = pair(isOther, cloneSimple);

//take all functors in a list.
const functors = list(arrayFunctor, dateFunctor, objectFunctor, otherFunctor);
const getFunctor = (obj) => functors.find(fn => fn.guard(obj)).action(obj);
const clone = (obj) => getFunctor(obj)(children => clone(children));

const isFunction = (obj) => !!(obj && obj.constructor && obj.call && obj.apply);
const toFunction = (job) => isFunction(job) ? job : () => job;
const emptyFn = _ => _;
const setPromise = (job) => (data, success) => new Promise((resolve, reject) => {
    const dataCopy = clone(data);
    const fn = job.getOrElse(emptyFn);
    if (success) {
        return (fn.length <= 1) ? resolve(fn(dataCopy)) : fn(dataCopy, resolve, reject);
    } else {
        return reject(dataCopy);
    }
});
/**
 * Task class is for asyns/sync jobs. You can provide 3 types on tasks
 *      @Task((resolve,reject)=>resolve()) // resolve reject params
 *      @Task(()=>3) synchronus function with returning value !important argumentList have to be empty
 *      @Task(3) // Static values
 * */
//Define Private methods;
const _parent = Symbol('_parent');
const _topRef = Symbol('_topRef');
const _topParent = Symbol('_topParent');
const _children = Symbol('_children');
const _resolvers = Symbol('_resolvers');
const _rejecters = Symbol('_rejecters');
const _resolve = Symbol('_resolve');
const _reject = Symbol('_reject');
const _bottomRef = Symbol('_bottomRef');
const _uuid = Symbol('_uuid');
const _create = Symbol('_create');
const _task = Symbol('_task');
const _setPromise = Symbol('_setPromise');
const _setParent = Symbol('_setParent');
const _addParent = Symbol('_addParent');
const _setChildren = Symbol('_setChildren');
const _resolveRun = Symbol('_resolveRun');
const _rejectRun = Symbol('_rejectRun');
const _triggerUp = Symbol('_triggerUp');
const _triggerDown = Symbol('_triggerDown');
const _run = Symbol('_run');
const _flatMap = Symbol('_flatMap');
const _copyJob = Symbol('_copyJob');
const _getTopRef = Symbol('_getTopRef');
const _getBottomRef = Symbol('_getBottomRef');
const _copy = Symbol('_copy');

class Task {

    constructor(job, parent) {
        this[_parent] = none();
        this[_topRef] = none();
        this[_topParent] = none();
        this[_children] = List.empty();
        this[_resolvers] = List.empty();
        this[_rejecters] = List.empty();
        this[_resolve] = none();
        this[_reject] = none();
        this[_bottomRef] = none();
        this[_uuid] = Symbol('uuid');
        this[_create](job, parent);
    }

    //private function.
    [_create](job, parent) {
        this[_setParent](parent);
        this[_task] = job !== undefined ? some(toFunction(job)) : none();
        return this;
    };

    [_setPromise](job) {
        return setPromise(job);
    };

    [_setParent](parent) {
        if (parent && parent.isTask && parent.isTask()) {
            this[_parent] = some((..._) => parent[_triggerUp](..._));
            this[_topRef] = some((..._) => parent[_getTopRef](..._));
            this[_topParent] = some((..._) => parent[_addParent](..._));
        }
    };

    [_addParent](parent) {
        this[_topParent].getOrElse((parent) => {
            parent[_setChildren](this);
            this[_setParent](parent);
        })(parent);
        return this;
    };

    [_setChildren](children) {
        if (children && children.isTask && children.isTask()) {
            this[_children] = this[_children].insert((..._) => children[_run](..._));
            this[_bottomRef] = some((..._) => children[_getBottomRef](..._));
        }

    };

    [_resolveRun](data) {
        this[_resolvers].forEach(fn => fn(data));
        this[_resolve].getOrElse(emptyFn)(clone(data));
        this[_resolve] = none();
        this[_triggerDown](data, true);
        return clone(data);
    };

    [_rejectRun](data) {
        this[_rejecters].forEach(fn => fn(clone(data)));
        this[_reject].getOrElse(emptyFn)(clone(data));
        this[_reject] = none();
        this[_triggerDown](data, false);
        return clone(data);
    };

    [_triggerUp]() {
        return this[_parent].getOrElse(() => this[_run]())();
    };


    [_triggerDown](data, resolve) {
        this[_children].map(child => child(data, resolve));
    };

    [_run](data, success = true) {
        return this[_setPromise](this[_task])(data, success)
            .then((_) => this[_resolveRun](_))
            .catch((_) => this[_rejectRun](_));
    };

    [_flatMap](fn) {
        return this
            .map(fn)
            .map((responseTask) => {
                if (!(responseTask.isTask && responseTask.isTask())) {
                    return Promise.reject('flatMap has to return task');
                }
                return responseTask.unsafeRun();
            });
    };

    [_copyJob](parent) {
        const job = task(this[_task].get(), parent);
        job[_resolvers] = this[_resolvers];
        job[_rejecters] = this[_rejecters];

        if (parent) {
            parent[_setChildren](job);
        }
        return job;
    };

    [_getTopRef](uuid, parent) {
        return this[_topRef]
            .getOrElse((uuid, parent) => this[_copy](uuid, parent))(uuid, parent);
    };

    [_getBottomRef](uuid, parent, goNext = false) {
        const copyJob = goNext ? parent : this[_copyJob](parent);
        const next = goNext || this[_uuid] === uuid;
        return this[_bottomRef].getOrElse((uuid, job) => job)(uuid, copyJob, next);
    }

    [_copy](uuid) {
        return this[_getBottomRef](uuid);
    };

    copy() {
        return this[_getTopRef](this[_uuid]);
    };


    map(fn) {
        const job = task(fn, this);
        this[_setChildren](job);
        return job;
    };

    flatMap(fn) {
        return this[_flatMap](fn)
    };

    through(joined) {
        return joined
            .copy()
            [_addParent](this);
    };

    forEach(fn) {
        return this.map((d, res) => {
            fn(d);
            res(d);
        });
    };

    resolve(fn) {
        this[_resolvers] = this[_resolvers].insert(fn);
        return this;
    };

    reject(fn) {
        this[_rejecters] = this[_rejecters].insert(fn);
        return this;
    }

    isTask() {
        return this.toString() === '[object Task]';
    }

    toString() {
        return '[object Task]'
    };

    clear() {
        this[_resolvers] = List.empty();
        this[_rejecters] = List.empty();
        return this;
    }

    /**
     * Method running executor and return Promise.
     * @param resolve executed when resolved
     * @param reject executed when rejected
     * */
    unsafeRun(resolve = emptyFn, reject = emptyFn) {
        return new Promise((res, rej) => {
            this[_resolve] = some((data) => {
                resolve(data);
                res(data);
            });
            this[_reject] = some((data) => {
                reject(data);
                rej(data);
            });
            this[_triggerUp]();
        });
    };


    static empty() {
        return task();
    };

    static all(tasks = [], context = {}) {
        return task()
            .flatMap(() => task(
                Promise.all(
                    tasks.map(_ => task(context)
                        .through(_)
                        .unsafeRun())
                )
            ));
    }
}

const task = (...tasks) => new Task(...tasks);

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

const promiseOption = (cond) => cond ? Promise.resolve(cond) : Promise.reject(cond);

const pipe = middleWare => task(({req, resp}, resolve, reject) => {
    middleWare(req, resp, (error) => option()
        .or(error, () => reject(error))
        .finally(() => resolve({req, resp})));
});

const {entries} = Object;

const addHeader = (header) => (req, resp, cb) => {
    entries(header)
        .forEach(([type, value]) => resp.setHeader(type, value));
    cb();
};

const jsonHeader = addHeader({'Content-Type': 'application/json'});
const htmlHeader = addHeader({'Content-Type': 'text/html; charset=utf-8'});

const {assign: assign$1} = Object;
const NOT_FOUND = (error) => JSON.stringify({
    status:  'error',
    message: error || 'Not Found'
});

const STREAM_END = Symbol('STREAM_END');
const hasData = (_) => _ !== STREAM_END;

const response = (response, body) => option()
    .or(hasData(body), () => response.end(JSON.stringify(body)))
    .finally(() => null);

const notFound = (response, error) => assign$1(response, {statusCode: 404})
    .end(NOT_FOUND(error));

function __async(g){return new Promise(function(s,j){function c(a,x){try{var r=g[x?"throw":"next"](a);}catch(e){j(e);return}r.done?s(r.value):Promise.resolve(r.value).then(c,d);}function d(e){c(e,1);}c();})}

const pipe$1 = (fn, ...fns) => (initial, ...args) => fns.reduce((acc, f) => f(acc, ...args), fn(initial, ...args));
const compose = (...fns) => pipe$1(...fns.reverse());
const curry = (fn, ...args) => (fn.length <= args.length) ? fn(...args) : (...more) => curry(fn, ...args, ...more);

const {isArray: isArray$1} = Array;
const {assign: assign$2} = Object;


const prop = curry((key, obj) => (obj || {})[key]);
const assoc = curry((key, val, obj) => assign$2(isArray$1(obj) ? [] : {}, obj || {}, {[key]: val}));

const lens = (get, set) => ({get, set});

const view = curry((lens, obj) => lens.get(obj));
const set = curry((lens, val, obj) => lens.set(val, obj));
const setAsync = curry((lens, val, obj) =>__async(function*(){ return lens.set(yield val, obj)}()));

const over = curry((lens, fn, obj) => set(lens, fn(view(lens, obj)), obj));
const overAsync = curry((lens, fn, obj) =>__async(function*(){ return set(lens, yield fn(view(lens, obj)), obj)}()));
const setOver = curry((setterLens, getterLens, fn, obj) => set(setterLens, fn(view(getterLens, obj)), obj));
const setOverAsync = curry((setterLens, getterLens, fn, obj) =>__async(function*(){ return set(setterLens, yield fn(view(getterLens, obj)), obj)}()));

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
        const match = pattern.match(/^(\/|\(\/)/g);
        return match === null ? pattern[0] === '(' ? '(/' + pattern.substring(1) : '/' + pattern : pattern;
    }
};

const route = (pattern) => {
    const _route = preparePattern(pattern)
        .replace(uriParams.ESCAPE_PARAM, '\\$&')
        .replace(uriParams.OPTIONAL_PARAM, '(?:$1)?')
        .replace(uriParams.NAMED_PARAM, (match, optional) => optional ? match : '([^\/]+)')
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
const getNext = (loc, match) => {
    const params = match.exec(loc);
    const next = replacePath(params);
    return {
        params,
        next
    }
};

const hasNext = ({next}) => (next === '' || next.indexOf('/') === 0);
const hasMatch = (loc, match) => option()
    .or(match.test(loc), () => {
        const next = getNext(loc, match);
        return hasNext(next) ? next : null
    })
    .finally(() => null);
const nextLink = next => next === '' ? null : next;

const nextLens = lensPath('next');
const paramsLens = lensPath('params');
const matchLens$1 = lensPath('match');

const hasRoute$1 = (route) => view(nextLens)(route) !== undefined;

const extractRoute = (pattern) => {
    const match = route(pattern);
    return (loc) => {
        const route = hasMatch(loc, match);
        return option()
            .or(hasRoute$1(route), () => compose(
                over(paramsLens, decodeParams),
                over(nextLens, nextLink),
                set(matchLens$1, true)
            )(route))
            .finally(() => compose(
                set(matchLens$1, false),
                set(paramsLens, null),
                set(nextLens, null)
            )({}));
    }
};

const router = (...args) => new Router(...args);

const {assign: assign$4} = Object;
const assignTo = (..._) => assign$4({}, ..._);

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
        this[_defaults] = assign$4({match: false}, defaults);

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
        return router(assign$4({match: false}, this[_defaults]), [...this[_routes]]);
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

const matchLens = view(lensPath('match'));
const skip = _ => !(matchLens(_) === false);
const match = _ => compose(promiseOption, skip)(_).then(() => _);

//Getters from request object Nodejs http module
const urlGet = lensPath('req', 'url');
const methodGet = lensPath('req', 'method');
const bodyGet = lensPath('req', 'body');

//Setters request to Router
const nextSet = lensPath('next');
const methodSet = lensPath('method');
const bodySet = lensPath('body');


const routeData = _ => compose(
    fromTo(nextSet, urlGet),
    fromTo(methodSet, methodGet),
    fromTo(bodySet, bodyGet)
)({}, _);

const responseStream = view(lensPath('resp'));


const routeMatch = (...routers) => task()
    .flatMap(_ => Router
        .merge(...routers)
        .trigger(routeData(_), responseStream(_)))
    .map(_ => match(_));

const lambda$1 = () => {
};
//Option will find true statement and returning result (Call by Value)
const option$1 = (...methods) => ({
    or(bool, left) {
        return option$1(...methods, {bool, left})
    },
    finally(right = lambda$1) {
        const {left} = methods.find(({bool}) => bool) || {};
        return left ? left() : right();
    }
});

const isMaybe = (_ = {}) => _ && _.isOption && _.isOption();
const isDefined$1 = (_) => _ !== undefined;

const toMaybe = (value) => option$1()
    .or(isMaybe(value), () => value)
    .or(!isDefined$1(value), () => none())
    .finally(() => some(value));

const storage = (copy) => {
    const store = new Map(copy);
    return {
        get(key) {
            return store.get(key) || none()
        },
        getValue(key) {
            const context = store.get(key) || none();
            return context.get();
        },
        set(key, value) {
            const data = toMaybe(value);
            store.set(key, data);
            return data;
        },
        has(key) {
            return store.has(key);
        },
        once(key) {
            const context = store.get(key) || none();
            store.delete(key);
            return context;
        },
        delete(key) {
            return store.delete(key);
        },
        clear() {
            store.clear();
        },
        copy() {
            return storage(store);
        }

    }
};

//stream lifecycle types
const RUN_TYPE = Symbol('RUN_TYPE');
const STOP_TYPE = Symbol('STOP_TYPE');
const ERROR_TYPE = Symbol('ERROR_TYPE');
const TOP_INSTANCE = Symbol('TOP_INSTANCE');
const isStream = (_ = {}) => _ && _.isStream && _.isStream();
const isDefined = (_) => _ !== undefined;
const isFunction$1 = (obj) => !!(obj && obj.constructor && obj.call && obj.apply);

const toFunction$1 = (job) => option$1()
    .or(isFunction$1(job), () => some(job))
    .or(isDefined(job), () => some(() => job))
    .finally(() => some(_ => _));

const emptyFn$1 = _ => _;


const getRoot = (instance, onReady) => option$1()
    .or(onReady.isSome(), () => instance.get()())
    .finally(() => instance.get());


const applyStep = cb => _ => __async(function*(){
    try {
        cb(yield _);
        return _;
    } catch (error) {
        return error;
    }
}());

const getContext = (context, field) => () => context.getValue(field);
const setContext = (context, field) => applyStep(_ => context.set(field, _));

const toPromise = (cb) => (...args) => Promise.resolve(cb(...args));

const setPromise$1 = (streamInstance, context) => (data, type) => {
    const instance = streamInstance.get(_instance);
    const onReady = streamInstance.get(_onReady);
    const onData = streamInstance.get(_onData);

    const rootContext = setContext(context, _root);
    const setStreamContext = setContext(context, _context);
    const getStreamContext = getContext(context, _context);

    const root = context
        .get(_root)
        .getOrElseLazy(() => rootContext(getRoot(instance, onReady)));

    return Promise.resolve(root)
        .then((root) => Promise.resolve(onReady.getOrElse(() => root(data))(root, data))
            .then((_) => setStreamContext(
                onData
                    .getOrElse(emptyFn$1)(_, getStreamContext(), root))
            ));


};


const topInstance = (data, type) => data === TOP_INSTANCE;
const noData = (data, type) => !data;
const isEmptyData = (data) => data === null;
const isError = (data, type) => type === ERROR_TYPE;
const isStop = (data, type) => type === STOP_TYPE;
/**
 * Stream is executing asynchronusly.
 * */

//Define Private methods
const _parent$1 = Symbol('_parent');
const _upParent = Symbol('_upParent');
const _topRef$1 = Symbol('_topRef');
const _topParent$1 = Symbol('_topParent');
const _child = Symbol('_child');
const _bottomRef$1 = Symbol('_bottomRef');
const _uuid$1 = Symbol('_uuid');
const _create$2 = Symbol('_create');
const _setParent$1 = Symbol('_setParent');
const _addParent$1 = Symbol('_addParent');
const _setChildren$1 = Symbol('_setChildren');
const _error = Symbol('_error');
const _stepUp = Symbol('_stepUp');
const _stop = Symbol('_stop');
const _triggerUp$1 = Symbol('_triggerUp');
const _stepDown = Symbol('_stepDown');
const _run$1 = Symbol('_run');
const _copyJob$1 = Symbol('_copyJob');
const _getTopRef$1 = Symbol('_getTopRef');
const _getBottomRef$1 = Symbol('_getBottomRef');
const _copy$1 = Symbol('_copy');
const _executeStep = Symbol('_executeStep');
const _onStreamFinish = Symbol('_onStreamFinish');
const _onStreamError = Symbol('_onStreamError');

const _onStreamFinishHandlers = Symbol('_onStreamFinishHandlers');
const _onStreamErrorHandlers = Symbol('_onStreamErrorHandlers');

const _refs = Symbol('_refs');
const _stream = Symbol('_stream');
const _setStream = Symbol('_setStream');

const _clearContext = Symbol('_clearContext');
const _root = Symbol('_root');
const _context = Symbol('_context');
const _getContext = Symbol('_getContext');
const _contextStorage = Symbol('_contextStorage');

const _instance = Symbol('_instance');
const _onReady = Symbol('_onReady');
const _onStop = Symbol('_onStop');
const _onData = Symbol('_onData');
const _onError = Symbol('_onError');

/*let uuuID = 0;
const uuid = () => uuuID++;*/

const setContextStorage = (context, contextID) => context
    .get(contextID)
    .getOrElseLazy(() => context.set(contextID, storage())
        .get());


class Stream {
    // job will return stream instance. In case onReady not defined, shortcut for.map method.
    // for non stream instances better to use tasks.

    constructor(job, parent) {
        this[_uuid$1] = Symbol('uuid');
        this[_refs] = storage();
        this[_stream] = storage();
        this[_contextStorage] = storage();
        this[_onStreamFinishHandlers] = storage();
        this[_onStreamErrorHandlers] = storage();
        this[_create$2](job, parent);
    }

    [_clearContext](contextID) {
        const contextContainer = this[_contextStorage].getValue(contextID);

        const context = getContext(contextContainer, _context)();
        contextContainer.clear();
        this[_contextStorage].delete(contextID);
        return context;
    }

    [_getContext](contextID) {
        return setContextStorage(this[_contextStorage], contextID);
    }

    [_create$2](job, parent) {
        this[_setParent$1](parent);
        this[_stream].set(_instance, toFunction$1(job));
        return this;
    }

    [_addParent$1](parent) {
        this[_refs].get(_topParent$1)
            .getOrElse((parent) => {
                parent[_setChildren$1](this);
                this[_setParent$1](parent);
            })(parent);
        return this;
    };

    [_setParent$1](parent) {
        if (isStream(parent)) {
            this[_refs].set(_parent$1, (..._) => parent[_triggerUp$1](..._));
            this[_refs].set(_topRef$1, (..._) => parent[_getTopRef$1](..._));
            this[_refs].set(_topParent$1, (..._) => parent[_addParent$1](..._));
            this[_refs].set(_upParent, (..._) => parent[_run$1](..._));
        }
    }

    [_setChildren$1](child) {
        if (isStream(child)) {
            this[_refs].set(_child, (..._) => child[_run$1](..._));
            this[_refs].set(_bottomRef$1, (..._) => child[_getBottomRef$1](..._));
        }

    };


    [_triggerUp$1](data, type, contextID) {
        this[_refs]
            .get(_parent$1)
            .getOrElse((data, type) => this[_run$1](isEmptyData(data) ? TOP_INSTANCE : data, type, contextID))(data, type, contextID);

    };


    [_copyJob$1](parent) {
        const job = stream(null, parent);
        job[_setStream](this[_stream]);

        if (parent) {
            parent[_setChildren$1](job);
        }
        return job;
    };

    [_setStream](handlers) {
        this[_stream] = handlers.copy();
    };


    [_getTopRef$1](uuid) {
        return this[_refs].get(_topRef$1)
            .getOrElse((uuid) => this[_copy$1](uuid))(uuid);
    };


    [_getBottomRef$1](uuid, parent, goNext = false) {
        const copyJob = goNext ? parent : this[_copyJob$1](parent);
        const next = goNext || this[_uuid$1] === uuid;
        return this[_refs]
            .get(_bottomRef$1)
            .getOrElse((uuid, job) => job)(uuid, copyJob, next);
    }

    [_copy$1](uuid) {
        return this[_getBottomRef$1](uuid);
    };

    [_stepDown](data, type, contextID) {
        this[_refs]
            .get(_child)
            .getOrElse(
                (data, type) => option$1()
                    .or(isStop(data, type), () => {
                        const context = this[_clearContext](contextID);
                        this[_onStreamFinishHandlers]
                            .once(contextID)
                            .getOrElse(emptyFn$1)(context);
                    })
                    .or(isError(data, type), () => {
                        this[_onStreamErrorHandlers]
                            .once(contextID)
                            .getOrElse(emptyFn$1)(data);
                    })
                    .finally(() => this[_stepUp](null, type, contextID))
            )(data, type, contextID);


    };

    [_run$1](data, type, contextID) {
        option$1()
            .or(isError(data, type), () => this[_error](data, type, contextID))
            .or(isStop(data, type), () => this[_stop](data, type, contextID))
            .or(noData(data, type) && !isStop(data, type), () => this[_stepUp](data, type, contextID))
            .finally(() => this[_executeStep](data, type, contextID));
    }

    [_executeStep](data, type, contextID) {
        setPromise$1(this[_stream], this[_getContext](contextID))(data, type)
            .then(
                (_) => option$1()
                    .or(topInstance(data, type) && noData(_, type), () => this[_stop](_, type, contextID))
                    .finally(() => this[_stepDown](_, type, contextID))
            ).catch((_) => this[_triggerUp$1](_, ERROR_TYPE, contextID));
    };

    [_stop](data, type, contextID) {
        const sessionContext = this[_getContext](contextID);
        const instance = getContext(sessionContext, _root)();
        const context = getContext(sessionContext, _context);

        this[_stream]
            .get(_onStop)
            .getOrElse(() => Promise.resolve(data))(instance, context, data)
            .then((_) => this[_stepDown](_, STOP_TYPE, contextID));


    }

    [_stepUp](data, type, contextID) {
        this[_refs]
            .get(_upParent)
            .getOrElse(() => this[_run$1](TOP_INSTANCE, type, contextID))(data, type, contextID);

    }

    [_error](error, type, contextID) {
        const onError = this[_stream].get(_onError);
        const sessionContext = this[_getContext](contextID);
        const root = getContext(sessionContext, _root)();
        const context = this[_clearContext](contextID);
        return onError
            .getOrElse(() => Promise.reject(error))(root, context, error)
            .catch((error) => this[_stepDown](error, ERROR_TYPE, contextID))
    }

    [_onStreamFinish](cb, contextID) {
        this[_onStreamFinishHandlers].set(contextID, cb);
    };

    [_onStreamError](cb, contextID) {
        this[_onStreamErrorHandlers].set(contextID, cb);

    }
    //
    // return copy of new stream instance
    copy() {
        return this[_getTopRef$1](this[_uuid$1]);
    };
    // will take a functor (chunk)=>Promise
    // return new stream instance
    map(fn) {
        const job = stream(fn, this);
        this[_setChildren$1](job);
        return job;
    };

   /* // return new stream instance
    flatMap(fn) {
    };*/
    //Will take a stream, and add to tail
    // return new stream instance
    through(joined) {
        return joined
            .copy()
            [_addParent$1](this)
            .map(_ => _);
    };
    // Will take a task
    throughTask(_task) {
        return this.map(_ => task(_).through(_task).unsafeRun())
    };

    //OPTIONAL: onReady Means, taking initialisation object, and return promise with new params.
    // callback will take arguments (instance, data)=>Promise
    // return same instance

    onReady(cb) {
        this[_stream].set(_onReady, cb);
        return this;

    };

   /* // OPTIONAL: event to pause, for example filereader, or web socket
    // return same instance
    onPause(cb) {
        this[_stream].set(_onPause, toPromise(cb));
        return this;

    };

    //OPTIONAL: event to resume stream.
    // return same instance
    onResume(cb) {
        this[_stream].set(_onResume, toPromise(cb));
        return this;
    };*/

    //OPTIONAL: In case need to destroy instance
    // callback will take arguments (instance, context, data)=>Promise
    // return same instance
    onStop(callback) {
        this[_stream].set(_onStop, toPromise(callback));
        return this;
    };

    // OPTIONAL: every time data collected
    // Will return, chunk, and scope context. In case you need to manage own history.
    // callback will take arguments (data, context, instance)=>Promise
    // return same instance
    onData(callback) {
        this[_stream].set(_onData, callback);
        return this;
    };

    // OPTIONAL: handling error.
    // return same instance
    // callback will take arguments (instance, context, error)=>Promise
    onError(callback) {
        this[_stream].set(_onError, toPromise(callback));
        return this;

    }

    // boolean, if stream instance or not
    isStream() {
        return this.toString() === '[object Stream]';
    };


    //Infinite stream, skip error/ continue.
    //    @param errors, how many error retries, till fail.
    /*unsafeRun(errors) {
        return {
            stop() {

            },
            pause() {

            },
            resume() {

            }
        }
    };

    //Infinite stream, auto stop on error.
    safeRun() {
        return {
            stop() {

            },
            pause() {

            },
            resume() {

            }
        }
    }*/


    // Runs stream till return null. Will return Promise with instance context
    run() {
        //return Promise.
        return new Promise((resolve, reject) => {

            const contextID = Symbol('_contextID');

            this[_onStreamFinish]((data) => resolve(data), contextID);
            this[_onStreamError]((error) => reject(error), contextID);

            this[_triggerUp$1](null, RUN_TYPE, contextID);
        })
    }


    toString() {
        return '[object Stream]'
    };
    //Returns Empty Stream
    static empty() {
        return stream();
    };
}

const stream = (...args) => new Stream(...args);

const FINISHED = Symbol('FINISHED');

const isNull = (_) => _ === null;
const isFinished = (finish) => finish === FINISHED;

const pause = (timeout = 10) => new Promise((resolve) => setTimeout(() => resolve(), timeout));

const reader = (stream$$1) => {
    let finish = null;
    stream$$1.once('end', () => {
        finish = FINISHED;
    });
    return (size) => new Promise((resolve) => {
        const endEvent = () => resolve(stream$$1.read(size));
        const chunk = stream$$1.read(size);

        option$1()
            .or(isFinished(finish), () => resolve(null))
            .or(isNull(chunk), () => stream$$1
                .once('end', endEvent)
                .once('readable', () => __async(function*(){
                    //hack for readable event, hoopefully node js will fix on V12
                    yield pause(0);
                    stream$$1.removeListener('end', endEvent);
                    stream$$1.pause();
                    const chunk = stream$$1.read(size);
                    resolve(chunk);
                }()))
            )
            .finally(() => resolve(chunk));
    });
};

const readPromise = (stream$$1, {size} = {}) => __async(function*(){
    const read = reader(stream$$1);
    return {
        read() {return __async(function*(){
            const reader = yield read(size);
            return reader;
        }())},
        destroy() {return __async(function*(){
            stream$$1.destroy();
            return null;
        }())}
    }
}());

const writePromise = (stream$$1, {encoding} = {encoding: 'utf8'}) => __async(function*(){
    return ({
        write(chunk) {
            return new Promise((resolve) => stream$$1.write(chunk, encoding, () => resolve(chunk)))
        },
        end(chunk) {
            return new Promise((resolve) => stream$$1.end(chunk, encoding, () => resolve(chunk)))
        },
        finished(chunk) {
            return new Promise((resolve) => stream$$1.finished(chunk, () => resolve(chunk)))
        },
        destroy() {return __async(function*(){
            stream$$1.destroy();
            return null;
        }())},
        on(name, cb) {
            return stream$$1.on(name, (..._) => cb(..._))
        },
        once(name) {
            return new Promise((resolve) => stream$$1.once(name, (_) => resolve(_)))
        },
        readLast(chunk) {
            return new Promise((resolve, reject) => {
                let chunks = Buffer.alloc(0);
                stream$$1.on('data', (_) => {
                    chunks = Buffer.concat([chunks, _]);
                });
                stream$$1.on('end', () => {
                    stream$$1.destroy();
                    resolve(chunks);
                });
                stream$$1.on('error', (error) => reject(error));
                stream$$1.end(chunk);
            })
        },
        close() {return __async(function*(){
            return stream$$1.close();
        }())},
        pause() {return __async(function*(){
            return stream$$1.pause();
        }())},
        resume() {return __async(function*(){
            return stream$$1.resume();
        }())}
    });
}());

const readStream = (instance, options) => stream(() => readPromise(instance, options))
    .onReady((instance) => instance.read())
    .onStop((instance) => instance.destroy())
    .onError((instance) => Promise.reject(instance.destroy()));

const writeStream = (instance) => stream(() => writePromise(instance))
    .onReady((instance, chunk) => instance.write(chunk))
    .onStop((instance, context, data) => instance.end(data))
    .onError((instance) => Promise.reject(instance.destroy()));

const fileReadStream = (src, size) => readStream(fs.createReadStream(src), size);

const routes = router();

const fileStream = (responseStream) => fileReadStream('./examples/streamRest/divine-comedy.txt')
    .through(writeStream(responseStream))
    .run()
    .then(() => STREAM_END);

// fileStream();
routes.get('/txt', task(({resp}) => fileStream(resp)));

const routes$2 = router();

routes$2.get('/aaa', task(({req}) => ({response: 'a route', req})));
routes$2.get('/aab/:a', ({req}) => req);
routes$2.post('/aab', task(({req}) => req || 'no Body'));

const app = (req, resp) => task({req, resp})
    .through(pipe(morgan('combined')))
    .through(pipe(bodyParser.json()))
    .through(pipe(htmlHeader))
    .through(routeMatch(routes, routes$2))
    .unsafeRun();

const srv = http.createServer((req, resp) => {
    app(req, resp)
        .then(body => response(resp, body))
        .catch((error) => notFound(resp, error));

})
    .listen(5060, () => {
        const {port} = srv.address();
        console.log(`Server Listening on Port ${port} http://localhost:${port}/txt`);
    });
