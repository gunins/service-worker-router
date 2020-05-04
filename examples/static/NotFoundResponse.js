import {constants} from 'http2';

const htmlResponse = `<html><body>Resource Not Found</body></html>`;

export const NotFoundResponse = (response) => {
    response.statusCode = constants.HTTP_STATUS_NOT_FOUND;
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(htmlResponse)
};
