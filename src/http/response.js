
const NOT_FOUND = {
    status: 'Not Found'
};

const response = (response, body) => {
    response.write(JSON.stringify(body));
    response.end();
};

const notFound = (response) => {
    response.statusCode = 404;
    response.write(JSON.stringify(NOT_FOUND));
    response.end();
};

export {response, notFound}
