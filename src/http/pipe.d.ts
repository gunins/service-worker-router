import {Task} from 'functional_tasks/src/functional/core/Task';

export function pipe<A, B>(middleWare:A): Task<B>;
