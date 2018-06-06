'use strict';

const helper = require('./helper');

// this function should include commands that create indexes (if any)
// for any collections that the service may be using

// it should always return a promise
module.exports = function() {
    return Promise.resolve();
};
