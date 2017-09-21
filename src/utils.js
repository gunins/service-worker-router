const params = {
    OPTIONAL_PARAM: /\((.*?)\)/g,
    NAMED_PARAM:    /(\(\?)?:\w+/g,
    SPLAT_PARAM:    /\*\w+/g,
    ESCAPE_PARAM:   /[\-{}\[\]+?.,\\\^$|#\s]/g
};

const parseParams = (value) => {
    try {
        return decodeURIComponent(value.replace(/\+/g, ' '));
    }
    catch (err) {
        // Failover to whatever was passed if we get junk data
        return value;
    }
}

const extractQuery = (queryString) => queryString.split('&').map(keyValue => {
    const [key, value] = keyValue.split(/=(.+)/);
    return [key, parseParams(value)]
});

const setQuery = (queryString) => extractQuery(queryString).reduce((query, arg) => {
    const [name, value] = arg;
    return Object.assign({}, query, {
        [name]: (typeof query[name] === 'string') ? [query[name], value] :
                    (Array.isArray(query[name])) ? query[name].concat([value]) : value
    });
}, {});


const preparePattern = pattern => {
    if (pattern === '') {
        return pattern.replace(/^\(\/\)/g, '').replace(/^\/|$/g, '')
    } else {
        const match = pattern.match(/^(\/|\(\/)/g);
        return match === null ? pattern[0] === '(' ? '(/' + pattern.substring(1) : '/' + pattern : pattern;
    }
}

const route = (pattern) => {
    const _route = preparePattern(pattern)
        .replace(params.ESCAPE_PARAM, '\\$&')
        .replace(params.OPTIONAL_PARAM, '(?:$1)?')
        .replace(params.NAMED_PARAM, (match, optional) => optional ? match : '([^\/]+)')
        .replace(params.SPLAT_PARAM, '(.*)');

    return new RegExp('^' + _route);
};

const extractURI = (location) => {
    const [path, query] = location.split('?', 2);
    return {
        path,
        query: query ? setQuery(query) : {}
    }
};

const extractRoute = (pattern) => {
    const match = route(pattern);
    return (loc) => {
        if (match.test(loc)) {
            const params = match.exec(loc),
                next = params.input.replace(params[0], '');
            if (next === '' || next.indexOf('/') === 0) {

                return {
                    params: params.slice(1).map((param) => param ? decodeURIComponent(param) : null).filter(a => a !== null),
                    next:   next === '' ? null : next,
                    match:  true
                }
            }
        }
        return {
            params: null,
            next:   null,
            match:  false
        };
    }

}


export {extractRoute, extractURI};