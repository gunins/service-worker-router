import {lensPath, view, fromTo} from '../lib/lenses';
import {compose} from '../lib/curry';
import {promiseOption} from '../lib/option';
import {task} from 'functional/core/Task';


const matchLens = view(lensPath('match'));
const skip = _ => !(matchLens(_) === false);
const match = _ => compose(promiseOption, skip)(_).then(() => _);

//Getters fro request object
const urlGet = lensPath('req', 'url');
const methodGet = lensPath('req', 'method');
const bodyGet = lensPath('req', 'body');

//Setters response to Router
const nextSet = lensPath('next');
const methodSet = lensPath('method');
const bodySet = lensPath('body');

const routeData = _ => compose(
    fromTo(nextSet, urlGet),
    fromTo(methodSet, methodGet),
    fromTo(bodySet, bodyGet)
)({}, _);

const routeMatch = (router) => task(_ => routeData(_))
    .flatMap(_ => router.trigger(_))
    .map(_ => match(_));

export default routeMatch;
