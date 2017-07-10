'use strict';

const htmlToText = require('html-to-text');
const _ = require('lodash');
const validLanguages = ['en_GB', 'de_DE', 'el_GR', 'it_IT', 'pt_PT', 'sr_RS', 'es_ES'];

module.exports = {
	escapeSpecialChars: function(s){
	    return s.replace(/([\+\-!\(\)\{\}\[\]\^"~\*\?:\\])/g, (match) => {
	        return '\\' + match;
	    })
	    .replace(/&&/g, '\\&\\&')
	    .replace(/\|\|/g, '\\|\\|')
	    .replace(/'/g, '');
	}, 

	stripHTML: function(htmlString){
        return htmlToText.fromString(htmlString, {
            // ignoreImage: true,
            // ignoreHref: true,
            uppercaseHeadings: false
        });
    }, 

    getActiveRevision: function(deck){
	   return deck.revisions.find((rev) => (rev.id === deck.active));
	},

	getLanguage(language){
        // if language field is not identified, then set text processing to english
        // (this should not happen in normal execution)
        return (_.includes(validLanguages, language) ? language : 'en_GB');
	}, 

    expand: function(docs, expanded){
        return docs.map( (doc) => {
            doc.expanded = (expanded.hasOwnProperty(doc.solr_id)) ? expanded[doc.solr_id].docs : [];
            return doc;
        });
    }, 

    parseSpellcheck: function(spellcheck){

        // collations are returned in an array with the term 'collation' in odd cells
        // and the actual collations in even cells	      
        let suggestions = spellcheck.collations.map( (value, index) => {
        	return (index % 2 !== 0) ? value.collationQuery : '';
        }).filter( (c) => { return !_.isEmpty(c); });

        // collations are not present, so concatenate suggestions of individual terms
        let termSuggestion = '';
        for(let i=1; i<spellcheck.suggestions.length; i+=2){
            termSuggestion += spellcheck.suggestions[i].suggestion[0].word + ' ';
        }

        if(termSuggestion !== ''){
        	suggestions.push(termSuggestion.trim());
        }
		
       
	    return _.uniq(suggestions);
	}
};