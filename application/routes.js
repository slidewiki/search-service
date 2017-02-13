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
        path: '/get',
        handler: handlers.getResults,
        config: {
            validate: {
                query: {
                    keywords: Joi.string().required(),
                    field: Joi.string().valid('title', 'description', 'content', 'speakernotes'),
                    kind: [
                        Joi.string().valid('deck', 'slide', 'comment'),
                        Joi.array().items(Joi.string().valid('deck', 'slide', 'comment'))
                    ],
                    language: [
                        Joi.string().valid('en_GB', 'de_DE', 'el_GR', 'it_IT', 'pt_PT', 'sr_RS', 'es_ES'),
                        Joi.array().items(Joi.string().valid('en_GB', 'de_DE', 'el_GR', 'it_IT', 'pt_PT', 'sr_RS', 'es_ES'))
                    ],
                    license: [
                        Joi.string().valid('CC0', 'CC BY', 'CC BY-SA'),
                        Joi.array().items(Joi.string().valid('CC0', 'CC BY', 'CC BY-SA'))
                    ],
                    user: [
                        Joi.string(),
                        Joi.array().items(Joi.string())
                    ],
                    tag: [
                        Joi.string(),
                        Joi.array().items(Joi.string())
                    ],
                    sort: Joi.string().valid('score', 'lastUpdate'),
                    start: Joi.string().default(0)
                }
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
                    collection: Joi.string().valid('decks', 'slides', 'users', 'all')
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

    // suggest keywords or users
    server.route({
        method: 'GET',
        path: '/suggest/{source}',
        handler: handlers.suggest,
        config: {
            validate: {
                params: {
                    source: Joi.string().valid('keywords', 'users')
                },
                query: {
                    q: Joi.string()
                }
            },
            tags: ['api'],
            description: 'Get autosuggest results for users'
        }
    });
};
