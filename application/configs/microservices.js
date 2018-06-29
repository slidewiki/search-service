'use strict';

const co = require('../common');

module.exports = {
    'deck': {
        uri: (!co.isEmpty(process.env.SERVICE_URL_DECK)) ? process.env.SERVICE_URL_DECK : 'http://deckservice'
    },
};
