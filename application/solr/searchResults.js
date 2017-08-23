'use strict';

const solrClient = require('./lib/solrClient');
const { escapeSpecialChars } = require('./lib/util');
const _ = require('lodash'); 

function getSolrParameters(params){

    // if keywords are not specified, then fetch all
    params.keywords = params.keywords.trim();
    params.keywords = (params.keywords === '*:*') ? params.keywords : encodeURIComponent(params.keywords) ;

    // prepend a specific field to match keywords
    params.queryTerms = params.keywords;
    if(params.field && params.keywords !== '*:*') { params.queryTerms = params.field + ':' + params.keywords; }

    // if these params are arrays then make a disjunction of their values
    if(params.kind instanceof Array) { params.kind = params.kind.join(' OR '); }
    if(params.language instanceof Array) { params.language = params.language.join(' OR '); }
    if(params.user instanceof Array) { params.user = params.user.join(' OR '); }

    if(params.license){
        params.license = (params.license instanceof Array) ?
            params.license.map( (el) => { return '\"' + el + '\"'; }).join(' OR ') :
            '\"' + params.license + '\"';
    }
    if(params.tag){
        params.tag = (params.tag instanceof Array) ?
            encodeURIComponent(params.tag.map( (t) => {return `"${escapeSpecialChars(t)}"`;}).join(' OR ')) :
            encodeURIComponent(`"${escapeSpecialChars(params.tag)}"`);
    }

    // set sorting field
    params.sort = (params.sort) ? params.sort : 'score';
 
    // adjust variables based on page given
    if(!_.isNil(params.page)){ 
        params.rows = 50;
        params.start = (params.page - 1) * params.rows;
    }

    return params;
}

module.exports = {
    get: function(params){

        let solrParams = getSolrParameters(params);

        let solrQuery = [];

        // basic query clause
        solrQuery.push('q=' + solrParams.queryTerms);

        //filter clauses
        if(solrParams.kind) { solrQuery.push('fq=kind:(' + solrParams.kind + ')'); }
        if(solrParams.language) { solrQuery.push('fq=language:(' + solrParams.language + ')'); }
        if(solrParams.user) { solrQuery.push('fq=contributors:(' + solrParams.user + ')'); }
        if(solrParams.license) { solrQuery.push('fq=license:(' + solrParams.license + ')'); }
        if(solrParams.tag) { solrQuery.push('fq=tags:(' + solrParams.tag + ')'); }

        // get only active docs
        solrQuery.push('fq=active:true');

        // sort by
        solrQuery.push('sort=' + solrParams.sort + ' desc');

        // needed for pagination
        solrQuery.push('start=' + solrParams.start);
        solrQuery.push('rows=' + solrParams.rows);

        // collapse on sold_parent_id field (group by)
        solrQuery.push('fq={!collapse field=origin sort=\'score desc, db_revision_id desc\'}');

        // expand docs in the same group
        solrQuery.push('expand=true');
        solrQuery.push('expand.sort=score desc, db_revision_id desc');
        solrQuery.push('expand.rows=100');
        // solrQuery.push('facet=true');

        return solrClient.query(solrQuery.join('&'), 'swSearch');
    }, 

    getHierachical: function(queryParams){
        let params = getSolrParameters(queryParams);

        // build main query 
        let query = `q=${params.queryTerms}`;
        if(params.queryTerms != '*:*'){
            query += ` OR {!join from=parents to=solr_id score=total defType=edismax}${params.queryTerms}`;
        }

        // tagged filter clauses, so we can exclude when faceting
        if(params.kind) { query += `&fq={!tag=kindFilter}kind:(${params.kind})`; }
        if(params.language) { query += `&fq={!tag=languageFilter}language:(${params.language})`; }    
        if(params.user) { query += `&fq={!tag=usersFilter}contributors:(${params.user})`; }
        if(params.tag) { query += `&fq={!tag=tagsFilter}tags:(${params.tag})`; }

        // collapse on origin field (group by)
        query += `&fq={!collapse field=origin sort='db_id asc, db_revision_id desc'}`;
        
        // expand docs in same group
        query += `&expand=${params.expand}`;
        query += '&expand.sort=db_id asc, db_revision_id desc';
        query += '&expand.rows=100';

        // request spellcheck suggestions for the query terms
        query += `&spellcheck=${params.spellcheck}`;
        query += `&spellcheck.q=${params.keywords}`;

        // enable faceting and if needed exclude filter from facet counts
        query += `&facet=${params.facets}`;
        if(params.facets){
            query += `&facet.field=${(params.facet_exclude === 'kind') ? '{!ex=kindFilter}kind' : 'kind'}`;
            query += `&facet.field=${(params.facet_exclude === 'language') ? '{!ex=languageFilter}language' : 'language'}`;
            query += `&facet.field=${(params.facet_exclude === 'user') ? '{!ex=usersFilter}contributors' : 'contributors'}`;
            query += `&facet.field=${(params.facet_exclude === 'tags') ? '{!ex=tagsFilter}tags' : 'tags'}`;
        }
        
        // sort by 
        query += `&sort=${params.sort} desc`;

        // set parameters for pagination
        query += `&start=${params.start}&rows=${params.rows}`;

        // console.log(query);

        return solrClient.query(query, 'swSearch');
    }

};
