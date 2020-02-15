const {router, Router} = require('./dist/Router');
const {pipe} = require('./dist/http/pipe');
const match = require('./dist/http/match');
const {addHeader, jsonHeader, htmlHeader} = require('./dist/http/header');
const {response, notFound, STREAM_END} = require('./dist/http/response');

module.exports = {
    router,
    Router,
    pipe,
    match,
    addHeader,
    jsonHeader,
    htmlHeader,
    response,
    notFound,
    STREAM_END
};
