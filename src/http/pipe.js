import {task} from 'functional/core/Task';
import {option} from '../lib/option';

const pipe = middleWare => task(({req, resp}, resolve, reject) => {
    middleWare(req, resp, (error) => option()
        .or(error, () => reject(error))
        .finally(() => resolve({req, resp})));
});

export {pipe}
