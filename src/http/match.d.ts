import {Router} from "../Router";
import {Task} from 'functional_tasks/src/functional/core/Task';

export function routeMatch<A>(...routers: Router<A>[]): Task<A>;
