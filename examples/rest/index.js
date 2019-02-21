import http from 'http';
import morgan from 'morgan';
import bodyParser from 'body-parser'
import {task} from 'functional/core/Task';
import {pipe} from '../../src/http/pipe';
import {jsonHeader} from '../../src/http/header';
import {response, notFound} from '../../src/http/response';
import match from '../../src/http/match';

import routes from './rest';

const app = (req, resp) => task({req, resp})
    .through(pipe(morgan('combined')))
    .through(pipe(bodyParser.json()))
    .through(pipe(jsonHeader))
    .through(match(routes))
    .unsafeRun();

http.createServer((req, resp) => {
    app(req, resp)
        .then(body => response(resp, body))
        .catch((error) => notFound(resp, error));

}).listen(5050);
