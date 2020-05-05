import http from 'http';
import {staticServer} from './Static';
import {NotFoundResponse} from './NotFoundResponse';

const testIfGetMethod = ({method}) => method === 'GET' ? Promise.resolve() : Promise.reject();


const port = 8080;

http.createServer((req, resp) => {

    testIfGetMethod(req)
        .then(() => staticServer(req, resp, {directory: 'files'}))
        .catch(() => NotFoundResponse(resp))

}).listen(port, () => {
    console.log('app listening on port', port);
});

