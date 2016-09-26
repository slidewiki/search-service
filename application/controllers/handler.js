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
    helper.parse(request.params.queryparams).then( (queryparams) => {
      // fetch results from SOLR
      solrClient.get(queryparams).then( (results) => {
        reply(results);
      }).catch( (error) => {
        reply(boom.badImplementation());
      });
    }).catch( (error) => {
      reply(boom.badImplementation());
    });
  },

  // index all objects from DB to SOLR
  indexAll: function(){
    helper.indexAll().then( (res) => {
      reply(res);
    }).catch( (err) => {
      reply(boom.badImplementation());
    });
  }
};
