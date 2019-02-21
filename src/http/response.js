const NOT_FOUND = (error) => ({
    status: 'error',
    message:  error || 'Not Found'
});

const response = (response, body) => {
    response.write(JSON.stringify(body));
    response.end();
};

const notFound = (response, error) => {
    const message = NOT_FOUND(error);
    response.statusCode = 404;
    response.write(JSON.stringify(message));
    response.end();
};

export {response, notFound}
