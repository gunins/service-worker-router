## Immutable Router

Server side lazy router. Difference from client, client routers, can take same route on multiple locations on page. 
Because this router we will use in Server side and service workers. We need to handle it outside from express app.

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

        let routes = router();
        routes.get('/a', () => {
            return 'a route'
        });

        let res = await  routes.trigger({
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

        let routes = router();
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
import {router} from '../src/Router';
import {task} from 'functional/core/Task';

        let route = router();

        let taskB = task(b =>  b.params.concat(b.a));


        route.get('/:a', task(a => {
                                     let {params, next, method} = a;
                                     return {params, next, method}
                                 }).flatMap(data => {
                                     // trigger some nested routes useful if want to render /table or /chart with same data
                                     let route = router({a: data.params});
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