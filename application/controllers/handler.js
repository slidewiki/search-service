/*
Handles the requests by executing stuff and replying to the client. Uses promises to get stuff done.
*/
/* eslint promise/always-return: "off" */

'use strict';

const boom = require('boom'), //Boom gives us some predefined http codes and proper responses
    searchResults = require('../solr/searchResults'),
    suggest = require('../solr/suggestions'), 
    { expand, highlight, parseSpellcheck, parseFacets } = require('../solr/lib/util');

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

    // get hierarchical query results from SOLR
    getHierachicalResults: function(request, reply){
        searchResults.get(request.query).then( (results) => {
            if (request.query.expand) {
                expand(results.response.docs, results.expanded);
            }

            if (request.query.highlight) {
                highlight(results.response.docs, results.highlighting);
            }

            let spellcheck;
            if (request.query.spellcheck) {
                spellcheck = parseSpellcheck(results.spellcheck);
            }

            let facets;
            if(request.query.facets && results.facet_counts){
                facets = parseFacets(results.facet_counts);
            }


            reply({
                numFound: results.response.numFound,
                page: parseInt(request.query.page || 1),
                hasMore: results.response.numFound > results.response.start + 50,
                spellcheck: spellcheck,
                facets: facets,
                docs: results.response.docs
            });
        }).catch( (error) => {
            console.log(error);
            // request.log('searchResults.get', error);
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
