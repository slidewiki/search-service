/*
Handles the requests by executing stuff and replying to the client. Uses promises to get stuff done.
*/

'use strict';

const boom = require('boom'), //Boom gives us some predefined http codes and proper responses
    searchResults = require('../solr/searchResults'),
    suggest = require('../solr/suggestions'), 
    { expand, parseSpellcheck } = require('../solr/lib/util');

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

            // change this, fix swagger issue with boolean
            if(request.query.expand){
                expand(results.response.docs, results.expanded);
            }

            let spellcheck;
            if(request.query.spellcheck){
                spellcheck = parseSpellcheck(results.spellcheck);
            }

            reply({
                numFound: results.response.numFound,
                page: parseInt(request.query.page || 1),
                hasMore: results.response.numFound > results.response.start + 50,
                spellcheck: spellcheck,
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
