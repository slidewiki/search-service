'use strict';

const rp = require('request-promise'),
    microservices = require('../configs/microservices.js');


module.exports = {
    deckServiceRequest: function(docType, docId, callback){
        return rp.get({uri: microservices.deck.uri + '/'+ docType + '/' + docId}).then( (doc) => {
            return Promise.resolve(callback(JSON.parse(doc)));
        });
    }
};
