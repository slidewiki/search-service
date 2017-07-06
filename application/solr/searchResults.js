'use strict';

const solrClient = require('./lib/solrClient');
const { escapeSpecialChars } = require('./lib/util');
const _ = require('lodash'); 

function getSolrParameters(params){

    // if keywords are not specified, then fetch all
    params.keywords = (params.keywords === '*:*') ? params.keywords : encodeURIComponent(params.keywords) ;

    // prepend a specific field to match keywords
    if(params.field && params.keywords !== '*:*') { params.keywords = params.field + ':' + params.keywords; }

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

    console.log('edw ' + params.page);
    if(!_.isNil(params.page)){ 
        params.rows = 50;
        params.start = params.page * params.rows;
    }

    return params;
}

module.exports = {
    get: function(params){

        let solrParams = getSolrParameters(params);

        let solrQuery = [];

        // basic query clause
        solrQuery.push('q=' + solrParams.keywords);

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
        console.log(params);

        // build 
        let query = `q=${params.keywords} OR {!join from=parents to=solr_id score=total defType=edismax}${params.keywords}`;

        //filter clauses
        if(params.kind) { query += `&fq=kind:(${params.kind})`; }
        if(params.language) { query += `&fq=language:(${params.language})`; }    
        if(params.user) { query += `&fq=contributors:(${params.user})`; }
        if(params.tag) { query += `&fq=tags:(${params.tag})`; }

        query += `&start=${params.start}&rows=${params.rows}`;

        // console.log(query);

        return solrClient.query(query, 'swSearch');

    }
};
