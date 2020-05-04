import {parse} from 'url';
import {fileReadStream, writeStream} from 'functional_tasks';
import fs from 'fs';
import path from 'path';
import {FileMap} from './FileMap';


const fileExist = (pathname) => fs.existsSync(pathname);
const setPathName = (parsedUrl, {directory}) => parsedUrl.pathname === '/' ? `./${directory}/index.html` : `./${directory}${parsedUrl.pathname}`;

const parsedUrl = ({url}, options) =>{
	const uriPath = parse(url);
	return setPathName(uriPath, options);
}

const successDataResponse = (pathname, res) => {
	const ext = path.parse(pathname).ext;
	res.setHeader('Content-type', FileMap[ext] || 'text/plain');
	return fileReadStream(pathname)
		.through(writeStream(res))
		.run();
};

const fileResponse = async (res, pathname) => fileExist(pathname) ? successDataResponse(pathname, res) : Promise.reject();

export const staticServer = (req, res, options) => {
	const pathname = parsedUrl(req, options);
	return fileResponse(res, pathname)
}
