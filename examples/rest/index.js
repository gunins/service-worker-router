import {task} from 'functional/core/Task';
import morgan from 'morgan';
import http from 'http';
import bodyParser from 'body-parser'
import {response, notFound} from '../../src/http/response';
import {jsonHeader} from '../../src/http/header';
import {routeMatch} from '../../src/http/match';
import {pipe} from '../../src/http/pipe';

import {routes} from './rest';

const restPipe = (req, resp) => task({req, resp})
    .through(pipe(morgan('combined')))
    .through(pipe(jsonHeader))
    .through(pipe(bodyParser.json()))
    .flatMap(_ => routeMatch(routes)(_))
    .unsafeRun();

http.createServer((req, resp) => {
    restPipe(req, resp)
        .then(body => response(resp, body))
        .catch(() => notFound(resp));

}).listen(5050);
