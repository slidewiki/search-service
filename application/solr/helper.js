'use strict';

const htmlToText = require('html-to-text');
const { escapeSpecialChars } = require('./lib/util');

module.exports = {
    // form query params to solr params
    getSolrParameters(params){

        // if keywords are not specified, then fetch all
        params.keywords = (params.keywords === '*:*') ? params.keywords : '(' + encodeURIComponent(params.keywords) + ')';

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

        return params;
    }
};
