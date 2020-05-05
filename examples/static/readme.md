---
path: "/blog/static-file-server-nodejs-streams"
date: "2020-05-04"
title: "Static file server using streams"
description: "How to create static file server using Nodejs streams"
---

## Introduction

In my previous post I gave overview picture about streams, and my library [https://github.com/gunins/functional](https://github.com/gunins/functional).
To continue topic will create static file server, and show how easy is work with streams.
Before start will need to install `functional_tasks` again.

```bash
 npm i functional_tasks
```

Like I mention in previous topic streams are memory efficient, and for static files is very useful, because some files can be very large.
Also, I have to say this tutorial is just proof of concept, I tried to make as small as possible. To make in production, 
will need more error catching. For Typescript users, properly define types.

## What we need

Ok, there is list of components, what we need for static server.

- http module to handling http requests.
- fs module to working with files.
- File extension map to handle response content headers.
- And of course stream modules from `functional_tasks` package.

## Example

There is step by step what we will do.

- Extract file path from `http.IncommingMessage`
- Check if file Exists.
- Return httpStream on response, with correct content Header.
- Last will handle if file not exists, return Not Found response.

First we create FileMap.js, there will be binding to file extension. Like I mention at the beginning, this file 
not cover all types.

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

Since we have FileMap, we can start implement application logic.

First we need resolve and fix pathName. If pathname not defined, will bind to `index.html`. 
`parsedUrl` is Nodejs [`Url`](https://nodejs.org/api/url.html#url_class_url) module.


```javascript

const setPathName = (parsedUrl, {directory}) => 
  parsedUrl.pathname === '/' ? 
    `./${directory}/index.html` : 
    `./${directory}${parsedUrl.pathname}`;

```

Next we need to extract pathName from request [`IncommingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage).

```javascript
import {parse} from 'url';

const parsedUrl = ({url}, options) =>{
	const uriPath = parse(url);
	return setPathName(uriPath, options);
}
```

Now another step, we need to check if file from a requested path exist.

```javascript

import fs from 'fs';
const fileExist = (pathname) => fs.existsSync(pathname);

```

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

We convert response stream to `functional_tasks` compatible `const responseStream = writeStream(res);` and run it. 
When it finishes, will return Promise.

On more step, need run stream only if file exists.

```javascript

const fileResponse = async (res, pathname) => fileExist(pathname) ? successDataResponse(pathname, res) : Promise.reject();

``` 

Last step listen on httpServer.

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

Now, because we have to handle Not found if file not exists, here is file `NotFoundResponsejs`

```javascript

import {constants} from 'http2';

const htmlResponse = `<html><body>Resource Not Found</body></html>`;

export const NotFoundResponse = (response) => {
    response.statusCode = constants.HTTP_STATUS_NOT_FOUND;
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(htmlResponse)
};

``` 

This part just return "Resource Not Found" html response, with Not Found `statusCode`.

One more step, need to check, if request method is `GET`, for any other requests, will be not found.
`testifGetMethod` will return `Promise`. 

```javascript

const testIfGetMethod =({method}) => method === 'GET' ? Promise.resolve() : Promise.reject();

``` 

And there http Server, to listen incoming requests.

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


Full example can find in github here [https://github.com/gunins/service-worker-router/tree/master/examples/static](https://github.com/gunins/service-worker-router/tree/master/examples/static)

## Conclusion

Using Nodejs streams are easy, and no need for any extra dependencies. Of course out there is different static file libraries, but good to understand, how they working.

## References

- [Functional Tasks/ Streams](https://github.com/gunins/functional)
- [express alternative to use functional_tasks](https://github.com/gunins/service-worker-router) Possibly, in some future topics, will include,
how to create REST server, and use same code in Nodejs and service-workers
