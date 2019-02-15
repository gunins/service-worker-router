const lambda = () => {
};
//Option will find true statement and returning result (Call by Value)
const option = (...methods) => ({
    or(bool, left) {
        return option(...methods, {bool, left})
    },
    finally(right = lambda) {
        const {left} = methods.find(({bool}) => bool) || {};
        return left ? left() : right();
    }
});

// lazyOption will find true statement, and return function (Call by Name)
const lazyOption = (...methods) => ({
    or(bool, left) {
        return lazyOption(...methods, {bool, left})
    },
    finally(right = lambda) {
        const {left} = methods.find(({bool}) => bool) || {};
        return left ? left : right;
    }
});

const findAsync = ([head, ...tail]) => {
    const {bool, left} = head || {};
    return bool
        ? bool()
            .then(() => left)
            .catch(() => findAsync(tail))
        : Promise.reject();
};

const optionAsync = (...methods) => ({
    or(bool, left) {
        return optionAsync(...methods, {bool, left})
    },
    finally(right = lambda) {
        return findAsync(methods)
            .then(left => left())
            .catch(() => right())
    }
});

const promiseOption = (cond) => cond ? Promise.resolve(cond) : Promise.reject(cond);


export {option, lazyOption, optionAsync, promiseOption};
