import {option} from '../lib/option';

const {assign} = Object;
const NOT_FOUND = (error) => JSON.stringify({
    status:  'error',
    message: error || 'Not Found'
});

const STREAM_END = Symbol('STREAM_END');
const hasData = (_) => _ !== STREAM_END;

const response = (response, body) => option()
    .or(hasData(body), () => response.end(JSON.stringify(body)))
    .finally(() => null);

const notFound = (response, error) => assign(response, {statusCode: 404})
    .end(NOT_FOUND(error));

export {response, notFound, STREAM_END}
