'use strict';

const rp = require('request-promise'),
    microservices = require('../configs/microservices.js');


module.exports = {
    get: function(docType, docId){
        return rp.get({
        	uri: microservices.deck.uri + '/'+ docType + '/' + docId, 
        	json: true
        });
    }
};
