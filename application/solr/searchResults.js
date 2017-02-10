'use strict';

const solrClient = require('./solrClient'),
    helper = require('./helper');

module.exports = {
    get: function(params){

        let solrParams = helper.getSolrParameters(params);

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

        // collapse on sold_parent_id field (group by)
        solrQuery.push('fq={!collapse field=solr_parent_id sort=\'score desc, db_revision_id desc\'}');

        // expand docs in the same group
        solrQuery.push('expand=true');
        solrQuery.push('expand.sort=score desc, db_revision_id desc');
        solrQuery.push('expand.rows=100');

        return Promise.resolve(solrClient.query(solrQuery.join('&')));
    }
};
