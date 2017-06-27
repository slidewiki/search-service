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
    suggestKeywords: function(request, reply){
        suggest.findKeywords(request.query.q).then( (keywords) => {
            reply(keywords);
        }).catch( (err) => {
            request.log('error', err);
            reply(boom.badImplementation());
        });
    }, 

    suggestUsers: function(request, reply){
        suggest.findUsers(request.query.q).then( (users) => {
            reply(users);
        }).catch( (err) => {
            request.log('error', err);
            reply(boom.badImplementation());
        });
    }
};
