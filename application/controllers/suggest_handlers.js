/*
Handles the requests by executing stuff and replying to the client. Uses promises to get stuff done.
*/

'use strict';

const boom = require('boom'), //Boom gives us some predefined http codes and proper responses
    suggestions = require('../solr/suggestions');

module.exports = {

    // Suggest users for autosuggest functionality or INTERNAL_SERVER_ERROR
    findUsers: function(request, reply){
        suggestions.findUsers(request.params.q).then( (results) => {
            reply(results);
        }).catch( (error) => {
            request.log('suggestions.findUsers', error);
            reply(boom.badImplementation());
        });
    },

    // Suggest-as-you-type keywords functionality or INTERNAL_SERVER_ERROR
    findKeywords: function(request, reply){
        suggestions.findKeywords(request.params.q).then( (results) => {
            reply(results);
        }).catch( (error) => {
            request.log('suggestions.findKeywords', error);
            reply(boom.badImplementation());
        });
    }

};
