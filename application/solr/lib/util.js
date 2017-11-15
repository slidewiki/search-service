'use strict';

const htmlToText = require('html-to-text');
const _ = require('lodash');
const validLanguages = ['en_GB', 'de_DE', 'el_GR', 'it_IT', 'pt_PT', 'sr_RS', 'es_ES', 'nl_NL'];

let self = module.exports = {
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
            ignoreImage: true,
            // ignoreHref: true,
            uppercaseHeadings: false
        });
    }, 

    getActiveRevision: function(deck){
       let [latestRevision] = deck.revisions.slice(-1);
       return latestRevision;
	},

    getRevision: function(doc, revision){
        return doc.revisions.find( (rev) => (rev.id === revision));
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

        if(!spellcheck) return [];
        
        // first add solr collations in term suggestions 
        let suggestions = spellcheck.collations.map( (item) => { return item.collation.collationQuery; });

        // then concatenate suggestions of individual terms
        let termSuggestion = '';
        spellcheck.suggestions.forEach( (item) => {
            Object.keys(item).forEach( (key) => {

                let suggestionItem = item[key];

                if(suggestionItem.numFound > 0){
                    termSuggestion += suggestionItem.suggestion[0].word + ' ';
                }
            });
        });

        if(termSuggestion != ''){
            suggestions.push(termSuggestion.trim());
        }
       
	    return _.uniq(suggestions);
	}, 

    parseFacets: function(facets){
        // let facetsObj = {};
        
        // transform facets from array to object
        // Object.keys(facets.facet_fields).forEach( (facetName) => {
        //     facetsObj[facetName] = _.assign.apply(_, facets.facet_fields[facetName]);
        // });

        return facets.facet_fields;
    }, 

    isRoot: function(deck){
        let active = self.getActiveRevision(deck);
        return _.isEmpty(active.usage);
    },
};