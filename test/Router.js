import {router} from '../src/Router';
import {task} from 'functional/core/Task';
import {expect} from 'chai';
import {spy} from 'sinon';

describe('Router tests: ', () => {
    it('sample test', async () => {
        let routes = router();
        routes.get('/a', task(a => {
            return 'a route'
        }));

        let res = await  routes.trigger({
            next:   '/a',
            method: 'GET'
        }).unsafeRun();
        expect(res).to.be.eql('a route')

    });
    it('sample reject test', async () => {
        let cb = spy();
        let routes = router();
        routes.get('/a', task(a => {
            cb();
            return 'a route'
        }));

        let {match} = await routes.trigger({
            next:   '/ab',
            method: 'GET'
        }).unsafeRun();

        expect(match).to.be.false;

        let res = await routes.trigger({
            next:   '/a',
            method: 'GET'
        }).unsafeRun();

        expect(res).to.be.eql('a route');
        expect(cb.calledOnce).to.be.true
    });

    it('dynamic route', async () => {
        let routes = router();
        routes.get('/:a', task(a => {
            return a.params
        }));

        let res = await  routes.trigger({
            custom:  1,
            another: 2,
            next:    '/a',
            method:  'GET'
        }).unsafeRun();
        expect(res).to.be.eql(['a'])

    });
    it('nested route', async () => {
        let cb = spy();
        let route = router();

        let taskB = task(b => {
            cb();
            expect(b.params).to.be.eql(['b']);
            return b.params.concat(b.a)
        });

        let taskOne = task(a => {
            let {params, next, method} = a;
            expect(a.params).to.be.eql(['a']);
            cb();
            return {params, next, method}
        }).flatMap(data => {
            let route = router({a: data.params});
            route.get('/:b', taskB);
            cb();
            return route.trigger(data);
        });

        route.get('/:a', taskOne);

        let res = await  route.trigger({
            next:   '/a/b',
            method: 'GET'
        }).map(d => d.join(', '))
            .unsafeRun();
        expect(res).to.be.eql('b, a')
        expect(cb.callCount).to.be.eql(3);

    });

    it('inject function instead of task', async () => {
        let routes = router();
        routes.get('/a', a => {
            return 'a route'
        });

        let res = await  routes.trigger({
            next:   '/a',
            method: 'GET'
        }).unsafeRun();
        expect(res).to.be.eql('a route')
    });

});