import http from 'http';
import {staticServer} from './Static';
import {NotFoundResponse} from './NotFoundResponse';

const testIfGetMethod =({method}) => method === 'GET' ? Promise.resolve() : Promise.reject();

export const StaticFilesServer = (req, resp) =>
    testIfGetMethod(req)
        .then(() => staticServer(req, resp, {directory: 'files'}))
        .catch(() => NotFoundResponse(resp));

const port = 8080;

http
    .createServer(StaticFilesServer)
    .listen(port, () => {
        console.log('app listening on port', port);
    });

