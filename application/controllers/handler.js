/*
Handles the requests by executing stuff and replying to the client. Uses promises to get stuff done.
*/

'use strict';

const boom = require('boom'), //Boom gives us some predefined http codes and proper responses
    solrClient = require('../solr/solrClient'),
    searchResults = require('../solr/searchResults'),
    suggest = require('../solr/suggestions');

module.exports = {

    // Get query results from SOLR or return INTERNAL_SERVER_ERROR
    getResults: function(request, reply){
        searchResults.get(request.query).then( (results) => {
            reply(results);
        }).catch( (error) => {
            request.log('searchResults.get', error);
            reply(boom.badImplementation());
        });
    },

    // suggest keywords or users
    suggest: function(request, reply){
        let suggestFunction = (request.params.source === 'keywords') ? suggest.findKeywords : suggest.findUsers;

        suggestFunction(request.query.q).then( (res) => {
            reply(res);
        }).catch( (error) => {
            request.log('suggest', error);
            reply(boom.badImplementation());
        });
    }
};
