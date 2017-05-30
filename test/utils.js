import {extractRoute, extractURI} from '../src/utils';
import {expect} from 'chai';

describe('utils for uri segment manipulation', () => {

    describe('extracting Query and segment', () => {
        it('getUri return query, and segments', () => {
            let location = '/one/two?a=1&b=2&c=3&a=23';
            let {path, query} = extractURI(location);
            expect(path).to.be.eql('/one/two');
            expect(query).to.be.eql({a: ['1', '23'], b: '2', c: '3'})
        });

        it('getUri return query, and path, more complex', () => {
            let location = '/one/two?a=someString&b={formula:3}&c=crazySegment=4';
            let {path, query} = extractURI(location);
            expect(path).to.be.eql('/one/two');
            expect(query).to.be.eql({a: 'someString', b: '{formula:3}', c: 'crazySegment=4'})
        });

        it('getUri return path', () => {
            let location = '/one/two';
            let {path, query} = extractURI(location);
            expect(path).to.be.eql('/one/two');
            expect(query).to.be.eql({})
        });
    });
    describe('Manipulate segments', () => {
        it('test full match', () => {
            let pattern = '/a/b',
                loc = '/a/b';
            let match = extractRoute(pattern);
            expect(match(loc)).to.be.eql({params: [], next: null, match: true});

            let patternA = '/a/b',
                locA = '/a/b/c';
            let matchA = extractRoute(patternA);
            expect(matchA(locA)).to.be.eql({params: [], next: '/c', match: true});

            let patternB = 'a/b',
                locB = '/a/b/c';
            let matchB = extractRoute(patternB);
            expect(matchB(locB)).to.be.eql({params: [], next: '/c', match: true});
        });
        it('test not match', () => {
            let pattern = '/a/b',
                loc = '/a';
            let match = extractRoute(pattern);
            expect(match(loc)).to.be.eql({params: null, next: null, match: false});

            let patternA = '/a/b',
                locA = '/a/d/c';
            let matchA = extractRoute(patternA);
            expect(matchA(locA)).to.be.eql({params: null, next: null, match: false});

            let patternB = 'a/b',
                locB = '/d/b/c';
            let matchB = extractRoute(patternB);
            expect(matchB(locB)).to.be.eql({params: null, next: null, match: false});
        });

        it('Testing named params', () => {
            let pattern = '/a/:b',
                loc = '/a/b';
            let match = extractRoute(pattern);
            expect(match(loc)).to.be.eql({params: ['b'], next: null, match: true});


            let patternA = '/a/:b/:c',
                locA = '/a/b/c';
            let matchA = extractRoute(patternA);
            expect(matchA(locA)).to.be.eql({params: ['b', 'c'], next: null, match: true});

            let patternB = ':a/b',
                locB = '/a/b/c';
            let matchB = extractRoute(patternB);
            expect(matchB(locB)).to.be.eql({params: ['a'], next: '/c', match: true});
        })

        it('Testing optional named params', () => {
            let pattern = '/a(/:b)',
                loc = '/a/b';
            let match = extractRoute(pattern);
            expect(match(loc)).to.be.eql({params: ['b'], next: null, match: true});


            let patternA = '/a(/:b)',
                locA = '/a';
            let matchA = extractRoute(patternA);
            expect(matchA(locA)).to.be.eql({params: [], next: null, match: true});

            let patternB = 'a(/:b)',
                locB = '/a/b/c';
            let matchB = extractRoute(patternB);
            expect(matchB(locB)).to.be.eql({params: ['b'], next: '/c', match: true});
        });
        it('Testing another optional named params', () => {
            let pattern = '/a(/)(:b)',
                loc = '/a/b';
            let match = extractRoute(pattern);
            expect(match(loc)).to.be.eql({params: ['b'], next: null, match: true});


            let patternA = '/a/(:b)',
                locA = '/a/';
            let matchA = extractRoute(patternA);
            expect(matchA(locA)).to.be.eql({params: [], next: null, match: true});

            let patternB = 'a/(:b)',
                locB = '/a';
            let matchB = extractRoute(patternB);
            expect(matchB(locB)).to.be.eql({params: null, next: null, match: false});
        });
        it('Testing splatl named params', () => {

            let pattern = '/a/*b',
                loc = '/a/big/uri/haha.js';
            let match = extractRoute(pattern);
            expect(match(loc)).to.be.eql({params: ['big/uri/haha.js'], next: null, match: true});

            let patternA = '/a/*b',
                locA = '/a';
            let matchA = extractRoute(patternA);
            expect(matchA(locA)).to.be.eql({params: null, next: null, match: false});

            let patternB = 'a/b*c',
                locB = '/a/bbig.js';
            let matchB = extractRoute(patternB);
            expect(matchB(locB)).to.be.eql({params: ['big.js'], next: null, match: true});
        });


    });

})
