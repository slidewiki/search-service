/*
These are routes as defined in https://docs.google.com/document/d/1337m6i7Y0GPULKLsKpyHR4NRzRwhoxJnAZNnDFCigkc/edit#
Each route implementes a basic parameter/payload validation and a swagger API documentation description
*/
'use strict';

const Joi = require('joi'),
  handlers = require('./controllers/handler');

module.exports = function(server) {

    // get query results from SOLR
    server.route({
      method: 'GET',
      path: '/get/{queryparams}',
      handler: handlers.getResults,
      config: {
        validate: {
          params: {
            queryparams: Joi.string()
          },
        },
        tags: ['api'],
        description: 'Get SOLR search results'
      }
    });
};
