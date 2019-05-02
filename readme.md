## Service Worker Router [![Build Status](https://travis-ci.org/gunins/service-worker-router.svg?branch=master)](https://travis-ci.org/gunins/service-worker-router)


Nodejs Server side and `Service Worker` lazy router. Difference from client, client routers can take same route on multiple locations on page. 
Because this router we will use in Server side and service workers. We need to handle it outside from express or any other http app.

Router taking static routes like `/a/b/c`, also dynamic `/a/:b/:c` dynamic part will return `data=>data.params` in same order.

- Optional params `/a(/:b)` in this case will be triggered route `/a` and `/a/b` in second case `b` return as param.
- Splat params supported as well `a/*b` when trigger route `/a/some/file.js` will return as param `some/file.js`

Router willl trigger only first match routes.


### Examples 

In general, router working with [tasks](https://github.com/gunins/functional) and returning tasks.

Router subscribe to method get and return value.

```javascript
import {router} from '../src/Router';
import {task} from 'functional/core/Task';

        const routes = router();
        routes.get('/a', () => {
            return 'a route'
        });

        const res = await  routes.trigger({
        //next is uri you want to trigger on router/
            next:   '/a',
            method: 'GET'
        }).unsafeRun().then(/*success promise*/);
        
        //unsafeRun() you call, because you might want to do extra actions, see complex example below.

```

Router subscribe to method and taking params

```javascript
import {router} from '../src/Router';
import {task} from 'functional/core/Task';

        const routes = router();
        routes.get('/:a/:b', a => {
           //  a.params =['a','b'];
           
            return 'a route'
        });

        routes.trigger({
            next:   '/a/b',
            method: 'GET'
        }).unsafeRun().then(/*success promise*/);

```

Router subscribe, and taking nested routes.

```javascript
    import {router} from 'functional-router';
    import {task} from 'functional/core/Task';

    const route = router();

    const taskB = task(b =>  b.params.concat(b.a));


    route.get('/:a', task(a => {
         const {params, next, method} = a;
         return {params, next, method}
     }).flatMap(data => {
         // trigger some nested routes useful if want to render /table or /chart with same data
         const route = router({a: data.params});
         route.get('/:b', taskB);
         return route.trigger(data);
     }));

     route.trigger({
        next:   '/a/b',
        method: 'GET'
     })
     // doing some extra general conversion  
     .map(data=>data.join(','))
     .unsafeRun()
     .then(/*success promise*/);

```

### Full Example for Nodejs http library

Defining routes similar like another router libraries. File called `rest.js`

```javascript

import {task} from 'functional_tasks';
import {router} from 'functional-router';

const routes = router();

routes.get('/aaa', task(({req}) => ({response: 'a route', req})));
routes.get('/aab/:a', ({req}) => req);
routes.post('/aab', task(({req}) => req || 'no Body'));

export default routes

```

Adding routes in app.

```javascript

    import http from 'http';
    import morgan from 'morgan';
    import bodyParser from 'body-parser'
    import {task} from 'functional/core/Task';
    import {pipe, jsonHeader, response, notFound, match} from 'functional-router';
    
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

```

As you see, all plugins are compatible.

Also you can stream data.

```javascript
    import {task, fileReadStream, writeStream} from 'functional_tasks';
    import {router, STREAM_END} from 'functional-router';
    
    const routes = router();
    
    const fileStream = (responseStream) => fileReadStream('./examples/streamRest/divine-comedy.txt')
        .through(writeStream(responseStream))
        .run()
        .then(() => STREAM_END);
    
    // fileStream();
    routes.get('/txt', task(({resp}) => fileStream(resp)));
    
    
    export default routes

```

There you hook in to stream, and returning, `STREM_END` flag, which notify router, stream is closed.

App will look same from above.

```javascript

    import http from 'http';
    import morgan from 'morgan';
    import bodyParser from 'body-parser'
    import {task} from 'functional_tasks';
    import {pipe, htmlHeader, response, notFound, match} from 'functional-router';
    
    import routes from './stream';
    
    const app = (req, resp) => task({req, resp})
        .through(pipe(morgan('combined')))
        .through(pipe(bodyParser.json()))
        .through(pipe(htmlHeader))
        .through(match(routes))
        .unsafeRun();
    
    http.createServer((req, resp) => {
        app(req, resp)
            .then(body => response(resp, body))
            .catch((error) => notFound(resp, error));
    
    }).listen(5060);

```

`match` method support multiple routers, for example.

```javascript
    import streamData from './stream';
    import rest from '../rest/rest'
    
    ...
        .through(match(streamData, rest))
    ...

```

See live example in `examples` folder.
