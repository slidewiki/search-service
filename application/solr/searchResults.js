'use strict';

const solrClient = require('./lib/solrClient');
const { escapeSpecialChars } = require('./lib/util');
const _ = require('lodash'); 

function getSolrParameters(params) {

    params.keywords = params.queryTerms = params.keywords.trim();

    params.queryTerms = params.keywords;

    // if we are searching a specific field, prepend field name
    if (params.field && params.keywords !== '*:*') { 
        params.queryTerms = `${params.field}:(${params.queryTerms})`; 
    }

    // set filters if needed
    if (params.kind) {
        params.kind = params.kind.join(' OR ');
    }
    
    if (params.language) {
        params.language = params.language.join(' OR ');
    }

    if (params.user) {
        params.user = params.user.join(' OR ');
    }
    
    if (params.tag) {
        params.tag = params.tag.map( (t) => {return `"${t}"`;}).join(' OR ');
    }

    // set sorting field
    params.sort = (params.sort) ? params.sort : 'score';
    params.hl = (params.highlight) ? params.highlight : false;

    // adjust variables based on page given
    if(!_.isNil(params.page)){ 
        params.rows = params.pageSize;
        params.start = (params.page - 1) * params.rows;
    }

    // these are needed for legacy supporting /search route
    if (_.isNil(params.facets)) {
        params.facets = false;
    }

    if (_.isNil(params.expand)) {
        params.expand = false;
    }

    if (_.isNil(params.spellcheck)) {
        params.spellcheck = false;
    }

    return params;
}

function getFilters(params) {
    let filters = [
        'active: true',

        // collapse on origin field (group by)
        '{!collapse field=origin sort="db_id asc, db_revision_id desc"}',
    ];

    // use tagged filter clauses, so we can exclude them when faceting
    if(params.kind) { 
        filters.push(`{!tag=kindFilter}kind:(${params.kind})`); 
    }

    if(params.language) { 
        filters.push(`{!tag=languageFilter}language:(${params.language})`); 
    }

    if(params.user) { 
        filters.push(`{!tag=usersFilter}creator:(${params.user})`); 
    }

    if(params.tag) { 
        filters.push(`{!tag=tagsFilter}tags:(${params.tag})`); 
    }

    return filters;
}

function getFacetFields(params) {
    return [
        `${(params.facet_exclude === 'kind') ? '{!ex=kindFilter}kind' : 'kind'}`,
        `${(params.facet_exclude === 'language') ? '{!ex=languageFilter}language' : 'language'}`,
        `${(params.facet_exclude === 'user') ? '{!ex=usersFilter}creator' : 'creator'}`,
        `${(params.facet_exclude === 'tag') ? '{!ex=tagsFilter}tags' : 'tags'}`,
    ];
}

module.exports = {
    get: function(queryParams) {
        let params = getSolrParameters({...queryParams});

        let query = {
            q: params.queryTerms, 
            fq: getFilters(params), 

            // includes matching scores, breaks field alias
            // fl: '*, score',
            
            // queries with 2 terms or less, require all terms to match
            // mm: 2,

            // phrase slop; consider as phrases terms that appear up to $ps distance
            ps: 2, 
            
            // expand options
            expand: params.expand, 
            'expand.sort': 'db_id asc, db_revision_id desc', 
            'expand.rows': 100,

            // spellcheck suggestion options
            spellcheck: params.spellcheck,
            'spellcheck.q': params.keywords,

            // facet options
            facet: params.facets,

            // sort by
            sort: `${params.sort} desc`, 

            // highlight options
            hl: params.hl,

            // pagination options
            start: params.start, 
            rows: params.rows,
        };

        // enable faceting and if needed exclude filter from facet counts
        if(params.facets){
            query['facet.field'] = getFacetFields(params);
        }

        return solrClient.query('swSearch', query);
    }
};
