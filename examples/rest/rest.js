import {task} from 'functional/core/Task';
import {router} from '../../src/Router';

const routes = router();

routes.get('/aaa', task(({req}) => ({response: 'a route', req})));
routes.get('/aab/:a', ({req}) => req);
routes.post('/aab', task(({req}) => req || 'no Body'));

export default routes
