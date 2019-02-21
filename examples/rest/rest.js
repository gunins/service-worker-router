import {task} from 'functional/core/Task';
import {router} from '../../src/Router';

const routes = router();

routes.get('/aaa', task(_ => ({response: 'a route', _})));
routes.get('/aab/:a', _ => _);
routes.post('/aab', task((_) => _ || 'no Body'));

export default routes
