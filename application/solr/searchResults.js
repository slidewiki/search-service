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

    if (params.educationLevel) {
        params.educationLevel = params.educationLevel.join(' OR ');
    }

    if (params.topics) {
        params.topics = params.topics.join(' OR ');
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

        // collapse results in origin field
        '{!tag=collapseFilter}{!collapse field=origin sort="db_id asc, isOriginal desc"}'
    ];

    // use tagged filter clauses, so we can exclude them when faceting
    if (params.kind) { 
        filters.push(`{!tag=kindFilter}kind:(${params.kind})`); 
    }

    if (params.language) { 
        filters.push(`{!tag=languageFilter}language:(${params.language})`); 
    }

    if (params.user) { 
        filters.push(`{!tag=usersFilter}creator:(${params.user})`); 
    }

    if (params.tag) { 
        filters.push(`{!tag=tagsFilter}tags:(${params.tag})`); 
    }

    if (params.educationLevel) {
        filters.push(`{!tag=educationLevelFilter}educationLevel:(${params.educationLevel})`);
    }

    if (params.topics) {
        filters.push(`{!tag=topicsFilter}topics:(${params.topics})`);
    }

    return filters;
}

function getFacetFields(params) {
    return [
        '{!ex=kindFilter}kind',
        '{!ex=languageFilter}language',
        '{!ex=usersFilter}creator',
        '{!ex=tagsFilter}tags',
        '{!ex=educationLevelFilter}educationLevel',
        '{!ex=topicsFilter}topics',
    ];
}
function getJsonFacet(facet, excludedFields, exclude=true, facetPrefixField, facetPrefixValue) {
    let excludeTags = [ 'collapseFilter' ];
    let facetName = facet.field;
    let limit = 50;

    if (excludedFields.includes(facet.excludeField) && !exclude) {
        facetName = `selected${facetName}`;
        limit = -1;
    }

    if (excludedFields.includes(facet.excludeField) && exclude) {
        excludeTags.push(facet.excludeFilter);
    }

    let facetDef = {
        type: 'terms',
        field: facet.field,
        facet: {
            rowCount: 'unique(origin)'
        },
        domain: {
            excludeTags: excludeTags
        },
        limit: limit,
        sort:{ 
            rowCount: 'desc' 
        }
    };

    if (facetPrefixField === facet.excludeField) {
        facetDef.prefix = facetPrefixValue;
    }

    return facetDef;
}

function getFacets(excludedFields, facetPrefixField, facetPrefixValue) {
    let facetDetails = [
        { field: 'language', excludeField: 'language', excludeFilter: 'languageFilter'},
        { field: 'creator', excludeField: 'user', excludeFilter: 'usersFilter'},
        { field: 'tags', excludeField: 'tag', excludeFilter: 'tagsFilter' },
        { field: 'educationLevel', excludeField: 'educationLevel', excludeFilter: 'educationLevelFilter' },
        { field: 'topics', excludeField: 'topics', excludeFilter: 'topicsFilter' },
    ];

    let jsonFacets = {};
    facetDetails.forEach( (facet) => {

        // facet definition
        jsonFacets[facet.field] = getJsonFacet(facet, excludedFields, true, facetPrefixField, facetPrefixValue);
            
        // if facet field is excluded, also add facet definition without excluding filter to get selected facet counts
        if (excludedFields.includes(facet.excludeField)) {
            jsonFacets[`selected${facet.field}`] = getJsonFacet(facet, excludedFields, false, facetPrefixField, facetPrefixValue);
        }
    });

    return jsonFacets;
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
            facet: false,

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
            // query['facet.field'] = getFacetFields(params);
            let jsonFacets = getFacets(params.facet_exclude || [], params.facet_prefix_field, params.facet_prefix_value);
            query['json.facet'] = JSON.stringify(jsonFacets);
        }

        return solrClient.query('swSearch', query, 'post');
    }
};
