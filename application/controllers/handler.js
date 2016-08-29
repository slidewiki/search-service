/*
Handles the requests by executing stuff and replying to the client. Uses promises to get stuff done.
*/

'use strict';

const boom = require('boom'), //Boom gives us some predefined http codes and proper responses
  solrClient = require('../solr/solrClient'),
  helper = require('../solr/helper');

module.exports = {

    // Get query results from SOLR or return INTERNAL_SERVER_ERROR
    getResults: function(request, reply){

        // parse query params
        var queryparams = helper.parse(request.params.queryparams);

        // fetch results from SOLR
        solrClient.get(queryparams, reply);
    },
};
