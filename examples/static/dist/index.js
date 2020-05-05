'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var http = _interopDefault(require('http'));
var url = require('url');
var functional_tasks = require('functional_tasks');
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var http2 = require('http2');

function __async(g){return new Promise(function(s,j){function c(a,x){try{var r=g[x?"throw":"next"](a);}catch(e){j(e);return}r.done?s(r.value):Promise.resolve(r.value).then(c,d);}function d(e){c(e,1);}c();})}

const FileMap = {
    '.ico':  'image/x-icon',
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.json': 'application/json',
    '.css':  'text/css',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.wav':  'audio/wav',
    '.mp3':  'audio/mpeg',
    '.svg':  'image/svg+xml',
    '.pdf':  'application/pdf',
    '.doc':  'application/msword'
};

const fileExist = (pathname) => fs.existsSync(pathname);
const setPathName = (parsedUrl, {directory}) => parsedUrl.pathname === '/' ? `./${directory}/index.html` : `./${directory}${parsedUrl.pathname}`;

const parsedUrl = ({url: url$$1}, options) =>{
	const uriPath = url.parse(url$$1);
	return setPathName(uriPath, options);
};

const successDataResponse = (pathname, res) => {
	const ext = path.parse(pathname).ext;
	res.setHeader('Content-type', FileMap[ext] || 'text/plain');
	return functional_tasks.fileReadStream(pathname)
		.through(functional_tasks.writeStream(res))
		.run();
};

const fileResponse = (res, pathname) =>__async(function*(){ return fileExist(pathname) ? successDataResponse(pathname, res) : Promise.reject()}());

const staticServer = (req, res, options) => {
	const pathname = parsedUrl(req, options);
	return fileResponse(res, pathname)
};

const htmlResponse = `<html><body>Resource Not Found</body></html>`;

const NotFoundResponse = (response) => {
    response.statusCode = http2.constants.HTTP_STATUS_NOT_FOUND;
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(htmlResponse);
};

const testIfGetMethod = ({method}) => method === 'GET' ? Promise.resolve() : Promise.reject();


const port = 8080;

http.createServer((req, resp) => {

    testIfGetMethod(req)
        .then(() => staticServer(req, resp, {directory: 'files'}))
        .catch(() => NotFoundResponse(resp));

}).listen(port, () => {
    console.log('app listening on port', port);
});
