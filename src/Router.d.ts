import {Task} from 'functional_tasks/src/functional/core/Task';

declare enum eMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

interface route<A> {
    pattern: string,
    method: eMethod,
    routeTask: Task<A>
}

interface Iroute<A> {
    remove(): void

    route(): route<A>
}


export class Router<A, B> {
    constructor(defaults?: B, routes?: any[])

    get(path: string, routeTask: Task<A>): Iroute<A>;

    post(path: string, routeTask: Task<A>): Iroute<A>;

    delete(path: string, routeTask: Task<A>): Iroute<A>;

    put(path: string, routeTask: Task<A>): Iroute<A>;

    copy(): Router<A, B>;

    removeRoute(route: Iroute<A>): void;

    RemoveAll(): void;

    addRequest(path: string, method: eMethod, cb: Task<A>): Iroute<A>;

    trigger<B, C>(options: B, resp: C): Task<A>

    static merge<B, C>(head: Router<B, C>, ...tail: Router<B, C>[]): Router<B, C>
}

export function router<A, B>(defaults?: B, routes?: any[]): Router<A, B>
