'use strict';

const htmlToText = require('html-to-text');
const _ = require('lodash');
const stemmerSupportedLanguages = ['en_GB', 'de_DE', 'el_GR', 'it_IT', 'pt_PT', 'sr_RS', 'es_ES', 'nl_NL'];
const qs = require('querystring');

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
            if (!_.includes(stemmerSupportedLanguages, suffix)) {
                suffix = 'general';
            }
        }

        return { short, suffix };
    }, 

    expand: function(docs, expanded){
        return docs.map( (doc) => {
            doc.forks = (expanded.hasOwnProperty(doc.origin)) ? expanded[doc.origin].docs : [];
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
        let facetFields = facets.facet_fields;

        // transform facets from array to object
        Object.keys(facetFields).forEach( (facetName) => {
            facetFields[facetName].forEach( (item) => {
                let key = Object.keys(item)[0];
                item.key = key;
                item.value = item[key];
                delete item[key];
            });
        });

        return facets.facet_fields;
    }, 

    parseJsonFacets: function(facets) {
        facets.language = facets.language.buckets;
        facets.creator = facets.creator.buckets;
        facets.tags = facets.tags.buckets;
        return facets;
    },

    mergeSelectedFacets: function(facets, query) {
        let fieldToFacet = {
            language: 'language', 
            user: 'creator',
            tag: 'tags',
        }; 

        // For facet fields that are excluded
        (query.facet_exclude || []).forEach( (excludedField) => {

            let selectedValues = query[excludedField];
            let facetName = fieldToFacet[excludedField];
            let selectedFacetName = `selected${facetName}`;

            // Add selected values to facets
            (selectedValues || []).forEach( (selected) => {

                // check if selected item is present in facet results
                let index = facets[facetName].buckets.findIndex( (item) => {
                    return item.val === selected;
                });

                if (index === -1) {

                    // find selected item in separate facet only for selected items
                    let found = facets[selectedFacetName].buckets.find( (item) => {
                        return item.val === selected;
                    });

                    if (found) {                      
                        facets[facetName].buckets.push(found);
                    }
                }
            });
        });

        return facets;
    },

    isRoot: function(deck){
        let active = self.getActiveRevision(deck);
        return _.isEmpty(active.usage);
    },

    getValue: function(value) {
        return (value || '');
    },
    
    getFirstLevelContent: function(contents) {
        let langFields = {};

        for(const item of contents) {
            let langCodes = self.getLanguageCodes(item.language);

            let content;
            if (item.type === 'slide') {
                content = `${self.getValue(item.title)} ${self.stripHTML(self.getValue(item.content))} ${self.stripHTML(self.getValue(item.speakernotes))}`;
            } else if (item.type === 'deck') {
                content = `${self.getValue(item.title)} ${self.getValue(self.getValue(item.description))}`;
            }

            if (langFields.hasOwnProperty(langCodes.suffix)) {
                langFields[langCodes.suffix].push(content);
            } else {
                langFields[langCodes.suffix] = [content];
            }
        }

        return langFields;
    }, 

    highlight: function(docs, hl) {
        return docs.map( (doc) => {
            doc.hl = (hl.hasOwnProperty(doc.solr_id)) ? hl[doc.solr_id] : {};
            return doc;
        });
    }, 

    getLinks: function(params, hasMore) {

        let links = {};
        let page = params.page;

        if (hasMore) {
            params.page = page + 1;
            links.next = `/search/v2?${qs.stringify(params)}`;
        }

        if (page > 1) {
            params.page = page - 1;
            links.previous = `/search/v2?${qs.stringify(params)}`;
        }

        return links;
    }, 

    toSolrIdentifier: function(deckNode) {
        return `deck_${deckNode.id}_${deckNode.variants.current}`;
    }, 

    stringify: function(node){
        return `${node.id}-${node.revision}`;
    },
};
