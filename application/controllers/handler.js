/*
Handles the requests by executing stuff and replying to the client. Uses promises to get stuff done.
*/

'use strict';

const boom = require('boom'), //Boom gives us some predefined http codes and proper responses
    solrClient = require('../solr/solrClient'),
    helper = require('../solr/helper'),
    initIndex = require('../solr/initIndex'),
    searchResults = require('../solr/searchResults');

module.exports = {

    // Get query results from SOLR or return INTERNAL_SERVER_ERROR
    getResults: function(request, reply){

        // parse query params
        helper.parse(request.params.queryparams).then( (queryparams) => {
            // fetch results from SOLR
            searchResults.get(queryparams).then( (results) => {
                reply(results);
            }).catch( (error) => {
                request.log('searchResults.get', error);
                reply(boom.badImplementation());
            });
        }).catch( (error) => {
            request.log('helper.parse', error);
            reply(boom.badImplementation());
        });
    },

    // index all objects from DB to SOLR
    indexAll: function(request, reply){
        initIndex.indexAll().then( (res) => {
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
    }
};
