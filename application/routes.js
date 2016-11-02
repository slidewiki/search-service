/*
These are routes as defined in https://docs.google.com/document/d/1337m6i7Y0GPULKLsKpyHR4NRzRwhoxJnAZNnDFCigkc/edit#
Each route implementes a basic parameter/payload validation and a swagger API documentation description
*/
'use strict';

const Joi = require('joi'),
    handlers = require('./controllers/handler'),
    suggestHandlers = require('./controllers/suggest_handlers');

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

    // index all data from db
    server.route({
        method: 'GET',
        path: '/index/{collection}',
        handler: handlers.indexAll,
        config: {
            validate: {
                params: {
                    collection: Joi.string().description('Could by one of: decks, slides, users, all')
                },
            },
            tags: ['api'],
            description: 'Index all data from DB in SOLR'
        }
    });

    // delete all data from db
    server.route({
        method: 'GET',
        path: '/delete',
        handler: handlers.deleteAll,
        config: {
            validate: {
                params: {
                },
            },
            tags: ['api'],
            description: 'Delete all documents from SOLR'
        }
    });

    // suggest users
    server.route({
        method: 'GET',
        path: '/suggest/users/{q}',
        handler: suggestHandlers.findUsers,
        config: {
            validate: {
                params: {
                    q: Joi.string()
                },
            },
            tags: ['api'],
            description: 'Get autosuggest results for users'
        }
    });

    // suggest keywords
    server.route({
        method: 'GET',
        path: '/suggest/keywords/{q}',
        handler: suggestHandlers.findKeywords,
        config: {
            validate: {
                params: {
                    q: Joi.string()
                },
            },
            tags: ['api'],
            description: 'Get autosuggest results for keywords'
        }
    });
};
