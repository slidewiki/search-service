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
        path: '/search',
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
                        Joi.string().valid('en_GB', 'de_DE', 'el_GR', 'it_IT', 'pt_PT', 'sr_RS', 'es_ES', 'nl_NL'),
                        Joi.array().items(Joi.string().valid('en_GB', 'de_DE', 'el_GR', 'it_IT', 'pt_PT', 'sr_RS', 'es_ES', 'nl_NL'))
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
                    start: Joi.string().default(0),
                    rows: Joi.string().default(50)
                }
            },
            tags: ['api'],
            description: 'Get SOLR search results #DEPRECATED'
        }
    });

    // get query results from SOLR
    server.route({
        method: 'GET',
        path: '/search/v2',
        handler: handlers.getHierachicalResults,
        config: {
            validate: {
                query: {
                    keywords: Joi.string().required().default('*:*'),
                    field: Joi.string().valid('title', 'description', 'content', 'speakernotes'),
                    kind: Joi.array().items(Joi.string().valid('deck', 'slide', 'comment')).single(),
                    language: Joi.array().items(Joi.string()).single(),
                    user: Joi.array().items(Joi.number().integer()).single(),
                    tag: Joi.array().items(Joi.string()).single(),
                    educationLevel: Joi.array().items(Joi.string()).single(),
                    topics: Joi.array().items(Joi.string()).single(),
                    sort: Joi.string().valid('score', 'lastUpdate').default('score'),
                    expand: Joi.boolean().default(true),
                    spellcheck: Joi.boolean().default(true),
                    facets: Joi.boolean().default(false),
                    facet_exclude: Joi.array().items(Joi.string().valid('kind', 'language', 'user', 'tag', 'educationLevel', 'topics')).single(),
                    facet_prefix_field: Joi.string().valid('language', 'user', 'tag'),
                    facet_prefix_value: Joi.string(),
                    highlight: Joi.boolean().default(false),
                    page: Joi.number().integer().min(1).default(1), 
                    pageSize: Joi.number().integer().min(1).default(50),
                }
            },
            tags: ['api'],
            description: 'Get SOLR search results'
        }
    });

    // suggest keywords
    server.route({
        method: 'GET',
        path: '/suggest/keywords',
        handler: handlers.suggestKeywords,
        config: {
            validate: {
                query: {
                    q: Joi.string()
                }
            },
            tags: ['api'],
            description: 'Get autosuggest results for keywords'
        }
    });

    // suggest keywords or users
    server.route({
        method: 'GET',
        path: '/suggest/users',
        handler: handlers.suggestUsers,
        config: {
            validate: {
                query: {
                    q: Joi.string()
                }
            },
            tags: ['api'],
            description: 'Get autosuggest results for users'
        }
    });
};
