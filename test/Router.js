import {router} from '../src/Router';
import {expect} from 'chai';

describe('Router tests: ', () => {
    it('sample test', () => {
        let tmpl = router();
        expect(3).to.be.eql(3);
    });
});