(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('../lib/lenses'), require('../lib/curry'), require('../lib/option'), require('functional_tasks'), require('../Router')) :
	typeof define === 'function' && define.amd ? define(['../lib/lenses', '../lib/curry', '../lib/option', 'functional_tasks', '../Router'], factory) :
	(global['http/match'] = global['http/match'] || {}, global['http/match'].js = factory(global.lenses_js,global.curry_js,global.option_js,global.functional_tasks,global.Router_js));
}(this, (function (lenses_js,curry_js,option_js,functional_tasks,Router_js) { 'use strict';

const matchLens = lenses_js.view(lenses_js.lensPath('match'));
const skip = _ => !(matchLens(_) === false);
const match = _ => curry_js.compose(option_js.promiseOption, skip)(_).then(() => _);

//Getters from request object Nodejs http module
const urlGet = lenses_js.lensPath('req', 'url');
const methodGet = lenses_js.lensPath('req', 'method');
const bodyGet = lenses_js.lensPath('req', 'body');

//Setters request to Router
const nextSet = lenses_js.lensPath('next');
const methodSet = lenses_js.lensPath('method');
const bodySet = lenses_js.lensPath('body');


const routeData = _ => curry_js.compose(
    lenses_js.fromTo(nextSet, urlGet),
    lenses_js.fromTo(methodSet, methodGet),
    lenses_js.fromTo(bodySet, bodyGet)
)({}, _);

const responseStream = lenses_js.view(lenses_js.lensPath('resp'));


const routeMatch = (...routers) => functional_tasks.task()
    .flatMap(_ => Router_js.Router
        .merge(...routers)
        .trigger(routeData(_), responseStream(_)))
    .map(_ => match(_));

return routeMatch;

})));
