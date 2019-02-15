import {task} from 'functional/core/Task';
import {router} from '../../src/Router';

const routes = router();
routes.get('/aaa', task(a => ({a: 'a route'})));
routes.get('/aab/:a', _ => _);
routes.post('/aab', task(({req: {body}}) => body || 'no Body'));

export {routes}
