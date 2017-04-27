/*
Handles the requests by executing stuff and replying to the client. Uses promises to get stuff done.
*/

'use strict';

const boom = require('boom'), //Boom gives us some predefined http codes and proper responses
    solrClient = require('../solr/solrClient'),
    initIndex = require('../solr/initIndex'),
    searchResults = require('../solr/searchResults'),
    suggest = require('../solr/suggestions');

module.exports = {

    // Get query results from SOLR or return INTERNAL_SERVER_ERROR
    getResults: function(request, reply){
        searchResults.get(request.query).then( (results) => {

            // delete solr header
            delete results.responseHeader;

            // delete autocomplete field and _version_ of results
            results.response.docs.forEach( (res) => {
                delete res.autocomplete;
                delete res._version_;
            });
            
            reply(results);
        }).catch( (error) => {
            request.log('searchResults.get', error);
            reply(boom.badImplementation());
        });
    },

    // index a collection from DB to SOLR
    indexAll: function(request, reply){
        initIndex.indexAll(request.params.collection).then( (res) => {
            reply(res);
        }).catch( (error) => {
            request.log('initIndex.indexAll', error);
            reply(boom.badImplementation());
        });
    },

    // delete all documents from SOLR
    deleteAll: function(request, reply){
        solrClient.deleteAll().then( (res) => {
            reply(res);
        }).catch( (error) => {
            request.log('solrClient.deleteAll', error);
            reply(boom.badImplementation());
        });
    },

    // suggest keywords or users
    suggest: function(request, reply){
        let suggestFunction = (request.params.source === 'keywords') ? suggest.findKeywords : suggest.findUsers;

        suggestFunction(request.query.q).then( (res) => {
            delete res.responseHeader;
            reply(res);
        }).catch( (error) => {
            request.log('suggest', error);
            reply(boom.badImplementation());
        });
    }
};
