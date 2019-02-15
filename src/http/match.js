import {lensPath, view} from '../lib/lenses';
import {compose} from '../lib/curry';
import {promiseOption} from '../lib/option';

const matchLens = view(lensPath('match'));
const skip = _ => !(matchLens(_) === false);
const match = _ => compose(promiseOption, skip)(_).then(() => _);

const routeMatch = (router) => ({req: {url, method, body}}) => router
    .trigger({
        next: url,
        method,
        body
    })
    .map(_ => match(_));

export {routeMatch}
