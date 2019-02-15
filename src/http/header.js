const {entries} = Object;

const addHeader = (header) => (req, resp, cb) => {
    entries(header)
        .forEach(([type, value]) => resp.setHeader(type, value));
    cb();
};

const jsonHeader = addHeader({'Content-Type': 'application/json'});
const htmlHeader = addHeader({'Content-Type': 'text/html; charset=utf-8'});

export {addHeader, jsonHeader, htmlHeader}
