'use strict';

const htmlToText = require('html-to-text');
const _ = require('lodash');
const stemmerSupportedLanguages = ['en_GB', 'de_DE', 'el_GR', 'it_IT', 'pt_PT', 'sr_RS', 'es_ES', 'nl_NL'];

// TODO (?) remove this once language codes have been fixed in code and database
const fixedLanguageCodes = {
    'en': 'en_GB',
    'de': 'de_DE',
    'it': 'it_IT',
    'es': 'es_ES',
    'nl': 'nl_NL',
    'el': 'el_GR',
    'pt': 'pt_PT',
    'sr': 'sr_RS',
};

let self = module.exports = {
    escapeSpecialChars: function(s){
        return s.replace(/([+\-!(){}[\]^"~*?:\\])/g, (match) => {
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

    getLanguageCodes(language){
        let short = null, suffix = 'general';

        if (language) {
            // language codes from translation some with dash
            language = language.replace('-', '_');

            short = language.substring(0, 2).toLowerCase();

            // fix if necessary
            suffix = fixedLanguageCodes[language.toLowerCase()] || language;
            if (_.includes(stemmerSupportedLanguages, language)) {
                suffix = language;
            } else {
                suffix = 'general';
            }
        }

        return { short, suffix };
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

        if(termSuggestion !== ''){
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