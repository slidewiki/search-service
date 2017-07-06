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
	}
};