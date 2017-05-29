let params = {
    OPTIONAL_PARAM: /\((.*?)\)/g,
    NAMED_PARAM:    /(\(\?)?:\w+/g,
    SPLAT_PARAM:    /\*\w+/g,
    ESCAPE_PARAM:   /[\-{}\[\]+?.,\\\^$|#\s]/g
};

let parseParams = (value) => {
    try {
        return decodeURIComponent(value.replace(/\+/g, ' '));
    }
    catch (err) {
        // Failover to whatever was passed if we get junk data
        return value;
    }
}

let iterateQueryString = (queryString, callback) => {
    let keyValues = queryString.split('&');
    keyValues.forEach((keyValue) => {
        let arr = keyValue.split('=');
        callback(arr.shift(), arr.join('='));
    });
}

let setQuery = (parts) => {
    let query = {};
    if (parts) {
        iterateQueryString(parts, (name, value) => {
            value = parseParams(value);
            if (!query[name]) {
                query[name] = value;
            }
            else if (typeof query[name] === 'string') {
                query[name] = [query[name], value];
            }
            else {
                query[name].push(value);
            }
        });
    }
    return query;
}


let route = (pattern) => {
    if (pattern === '') {
        pattern = pattern.replace(/^\(\/\)/g, '').replace(/^\/|$/g, '');
    } else {
        let match = pattern.match(/^(\/|\(\/)/g);
        if (match === null) {
            pattern = pattern[0] === '(' ? '(/' + pattern.substring(1) : '/' + pattern;
        }
    }

    let route = pattern.replace(params.ESCAPE_PARAM, '\\$&')
        .replace(params.OPTIONAL_PARAM, '(?:$1)?')
        .replace(params.NAMED_PARAM, function(match, optional) {
            return optional ? match : '([^\/]+)';
        }).replace(params.SPLAT_PARAM, '(.*)');

    return new RegExp('^' + route);
};

let extractURI = (location) => {
    let [segments, query] = location.split('?', 2);
    return {
        segments,
        query: setQuery(query)
    }
};

let extractRoute = (pattern) => {
    let match = route(pattern);
    return (loc) => {
        if (match.test(loc)) {
            let params = match.exec(loc),
                next = params.input.replace(params[0], '');

            return {
                params: params.slice(1).map((param) => param ? decodeURIComponent(param) : null).filter(a=>a!==null),
                next:   next === '' ? null : next
            }
        } else {
            return {
                params: null,
                next:   null
            }
        }
    }

}


export {extractRoute, setQuery, extractURI};