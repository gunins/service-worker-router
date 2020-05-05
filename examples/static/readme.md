# Static file server using streams

## Introduction

In my previous post I gave overview picture about streams, and my library [https://github.com/gunins/functional](https://github.com/gunins/functional).
To continue streams topic with some real world example, let's create static file server using streams.
Before start need to install dependency `functional_tasks`.

```bash
 npm i functional_tasks
```

Like I mention in the previous topic, streams are memory efficient. Because static files can be any size, using streams is very useful, to avoid memory failures.
Also, this tutorial is just proof of concept, I tried to make as simple as possible. To make in production, 
will need more error catching and more file extension type support. For Typescript users, need to define types.

## What we need

There is list of components, what we need for a static server.

- http module to handling http requests.
- fs module to working with files.
- File extension map to handle response content headers.
- Stream module from `functional_tasks` package.

## Example

Step by step what we will do.

- Extract file path from `http.IncommingMessage`
- Check if file Exists in target directory.
- read stream from file system and write to httpStream on response.
- Return Not Found response, if file not exist.

#### Step One

Create FileMap.js, there is correct header mapping to the file extension. Like I mention at the beginning, 
there not have all file types.

```javascript
export const FileMap = {
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
```

#### Step Two

Resolve and fix pathName. If pathname not defined, will bind to `index.html`. 
`parsedUrl` is Nodejs [`Url`](https://nodejs.org/api/url.html#url_class_url) module.


```javascript

const setPathName = (parsedUrl, {directory}) => 
  parsedUrl.pathname === '/' ? 
    `./${directory}/index.html` : 
    `./${directory}${parsedUrl.pathname}`;

```

#### Step Three

Extract pathName from request [`IncommingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage).

```javascript
import {parse} from 'url';

const parsedUrl = ({url}, options) =>{
	const uriPath = parse(url);
	return setPathName(uriPath, options);
}
```

#### Step Four

Check if file from a requested path exist.

```javascript

import fs from 'fs';
const fileExist = (pathname) => fs.existsSync(pathname);

```

#### Step Five

Now time to use streams.

```javascript

import {fileReadStream, writeStream} from 'functional_tasks';
// FileMap is file created above
import {FileMap} from './FileMap';
import path from 'path';

const successDataResponse = (pathname, res) => {
    // getting file extension
	const ext = path.parse(pathname).ext;
    // apply correct content-type header. text/plain for unknown types.
	res.setHeader('Content-type', FileMap[ext] || 'text/plain');
    // Create compatible write stream for `functional_tasks`
    const responseStream = writeStream(res);
    // read from file system, and save in to response. 
	return fileReadStream(pathname)
		.through(responseStream)
		.run();
};

```

I convert response stream to `functional_tasks` compatible `const responseStream = writeStream(res);` and run it. 
When stream finishes, will return Promise fulfilled.

#### Step Six

Only if file exists, we run stream.

```javascript

const fileResponse = async (res, pathname) => fileExist(pathname) ? successDataResponse(pathname, res) : Promise.reject();

``` 

#### Step Seven

Listen on httpServer.

```javascript

export const staticServer = (req, res, options) => {
	const pathname = parsedUrl(req, options);
	return fileResponse(res, pathname)
}

```

We prepare `pathname`, and return promise with stream. 
One more thing I want to tell regards to `options`, we support `directory`,
you can configure, which directory, you want to give to access.

Ok, all `Static.js` together:

```javascript
  
import {parse} from 'url';
import {fileReadStream, writeStream} from 'functional_tasks';
import fs from 'fs';
import path from 'path';
import {FileMap} from './FileMap';


const fileExist = (pathname) => fs.existsSync(pathname);
const setPathName = (parsedUrl, {directory}) => 
  parsedUrl.pathname === '/' ? 
    `./${directory}/index.html` : 
    `./${directory}${parsedUrl.pathname}`;

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

```  

#### Step Eight

Handle "Not found" if file not exists, here is file `NotFoundResponsejs`

```javascript

import {constants} from 'http2';

const htmlResponse = `<html><body>Resource Not Found</body></html>`;

export const NotFoundResponse = (response) => {
    response.statusCode = constants.HTTP_STATUS_NOT_FOUND;
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(htmlResponse)
};

``` 

This part return "Resource Not Found" html response, with Not Found `statusCode`.

#### Step Nine

Check, if request method is `GET`, for any other requests, will be not found.
`testifGetMethod` will return `Promise` resolve on success, reject if different method than `GET`. 

```javascript

const testIfGetMethod =({method}) => method === 'GET' ? Promise.resolve() : Promise.reject();

``` 

#### Step Ten

Http Server, to listen incoming requests.

```javascript

import http from 'http';
import {staticServer} from './Static';
import {NotFoundResponse} from './NotFoundResponse';

const testIfGetMethod =({method}) => method === 'GET' ? Promise.resolve() : Promise.reject();

const port = 8080;

http.createServer((req, resp) => {

  testIfGetMethod(req)
      .then(() => staticServer(req, resp, {directory: 'files'}))
      .catch(() => NotFoundResponse(resp))

}).listen(port, () => {
        console.log('app listening on port', port);
    });

```

That's it, now we have fully working static file server.

Full example can find in github here [https://github.com/gunins/service-worker-router/tree/master/examples/static](https://github.com/gunins/service-worker-router/tree/master/examples/static)

## Conclusion

Using Nodejs streams are easy, and no need for any extra dependencies. Of course out there is different static file libraries, but good to understand, how they working.

## References

- [Functional Tasks/ Streams](https://github.com/gunins/functional)
- [express alternative to use functional_tasks](https://github.com/gunins/service-worker-router) Possibly, in some future topics, will include,
how to create REST server, and use same code in Nodejs and service-workers
