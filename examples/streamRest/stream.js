import {task} from 'functional/core/Task';
import {fileReadStream} from 'functional/nodeStreams/fileReader';
import {writeStream} from 'functional/nodeStreams/nodeStreams';
import {router} from '../../src/Router';
import {STREAM_END} from '../../src/http/response';

const routes = router();

const fileStream = (responseStream) => fileReadStream('./examples/streamRest/divine-comedy.txt')
    .through(writeStream(responseStream))
    .run()
    .then(() => STREAM_END);

// fileStream();
routes.get('/txt', task(({resp}) => fileStream(resp)));


export default routes
