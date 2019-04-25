import {lensPath, view, fromTo} from '../lib/lenses';
import {compose} from '../lib/curry';
import {promiseOption} from '../lib/option';
import {task} from 'functional/core/Task';
import {Router} from '../Router';

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

export default routeMatch;
