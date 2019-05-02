(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('./lib/option'), require('./lib/curry'), require('./lib/lenses')) :
	typeof define === 'function' && define.amd ? define(['exports', './lib/option', './lib/curry', './lib/lenses'], factory) :
	(factory((global.utils = global.utils || {}, global.utils.js = {}),global.option_js,global.curry_js,global.lenses_js));
}(this, (function (exports,option_js,curry_js,lenses_js) { 'use strict';

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
    .reduce((acc, param) => option_js.option()
        .or(hasParam(param), () => [...acc, decodeURIComponent(param)])
        .finally(() => acc), []);

const paramsInput = lenses_js.view(lenses_js.lensPath('input'));
const paramsFirst = lenses_js.view(lenses_js.lensPath(0));

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
const hasMatch = (loc, match) => option_js.option()
    .or(match.test(loc), () => {
        const next = getNext(loc, match);
        return hasNext(next) ? next : null
    })
    .finally(() => null);
const nextLink = next => next === '' ? null : next;

const nextLens = lenses_js.lensPath('next');
const paramsLens = lenses_js.lensPath('params');
const matchLens = lenses_js.lensPath('match');

const hasRoute = (route) => lenses_js.view(nextLens)(route) !== undefined;

const extractRoute = (pattern) => {
    const match = route(pattern);
    return (loc) => {
        const route = hasMatch(loc, match);
        return option_js.option()
            .or(hasRoute(route), () => curry_js.compose(
                lenses_js.over(paramsLens, decodeParams),
                lenses_js.over(nextLens, nextLink),
                lenses_js.set(matchLens, true)
            )(route))
            .finally(() => curry_js.compose(
                lenses_js.set(matchLens, false),
                lenses_js.set(paramsLens, null),
                lenses_js.set(nextLens, null)
            )({}));
    }
};

exports.extractRoute = extractRoute;
exports.extractURI = extractURI;

Object.defineProperty(exports, '__esModule', { value: true });

})));
