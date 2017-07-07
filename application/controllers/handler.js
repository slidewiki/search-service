/*
Handles the requests by executing stuff and replying to the client. Uses promises to get stuff done.
*/

'use strict';

const boom = require('boom'), //Boom gives us some predefined http codes and proper responses
    solrClient = require('../solr/lib/solrClient'),
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

    getHierachicalResults: function(request, reply){
        searchResults.getHierachical(request.query).then( (results) => {
            reply({
                numFound: results.response.numFound,
                page: parseInt(request.query.page || 1),
                more: results.response.numFound > results.response.start + 50,
                docs: results.response.docs
            });
        }).catch( (error) => {
            request.log('searchResults.get', error);
            reply(boom.badImplementation());
        });
    },

    // suggest keywords
    suggestKeywords: function(request, reply){
        suggest.findKeywords(request.query.q).then( (res) => {
            reply(res);
        }).catch( (error) => {
            request.log('suggest', error);
            reply(boom.badImplementation());
        });
    }, 

    // suggest users
    suggestUsers: function(request, reply){
        suggest.findUsers(request.query.q).then( (res) => {
            reply(res);
        }).catch( (error) => {
            request.log('suggest', error);
            reply(boom.badImplementation());
        });
    }
};
