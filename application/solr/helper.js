'use strict';

const htmlToText = require('html-to-text');

function escapeSpecialChars(s){
    return s.replace(/([\+\-!\(\)\{\}\[\]\^"~\*\?:\\])/g, (match) => {
        return '\\' + match;
    })
    .replace(/&&/g, '\\&\\&')
    .replace(/\|\|/g, '\\|\\|')
    .replace(/'/g, '');
}

module.exports = {
    // form query params to solr params
    getSolrParameters(params){

        params.keywords = '(' + encodeURIComponent(escapeSpecialChars(params.keywords)) + ')';

        // prepend a specific field to match keywords
        if(params.field) { params.keywords = params.field + ':' + params.keywords; }

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
                encodeURIComponent(escapeSpecialChars(params.tag.join(' OR '))) :
                encodeURIComponent(escapeSpecialChars(params.tag));
        }

        // set sorting field
        params.sort = (params.sort) ? params.sort : 'score';

        return params;
    },
    
    // retrieve text from html
    stripHTML: function(htmlString){
        return htmlToText.fromString(htmlString, {
            // ignoreImage: true,
            // ignoreHref: true,
            uppercaseHeadings: false
        });
    }
};
