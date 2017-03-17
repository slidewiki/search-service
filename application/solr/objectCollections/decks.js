'use strict';

const solrClient = require('../solrClient'),
    services = require('../../microservices/microservicesConnection');

function newDeck(deckObj){
    let newDocs = deckObj.revisions.map( (rev) => {
        let doc = {
            solr_id: 'deck_' + deckObj._id + '-' + rev.id,
            solr_parent_id: 'deck_' + deckObj._id,
            db_id: deckObj._id,
            db_revision_id: rev.id,
            timestamp: deckObj.timestamp,
            lastUpdate: deckObj.lastUpdate,
            kind: 'deck',
            language: rev.language,
            license: deckObj.license,
            usage: rev.usage.map( (us) => { return us.id + '-' + us.revision; }),
            creator: deckObj.user,
            revision_owner: rev.user,
            contributors: deckObj.contributors.map( (contr) => { return contr.user; }),
            tags: rev.tags.map( (tag) => { return tag.tagName; }),
            active: ((rev.id === deckObj.active) || (rev.usage.length > 0)) ? true : false
        };

        // if language field is not identified, then set text processing to english
        // (this should not happen in normal execution)
        let lang = rev.language;
        let langs = ['en_GB', 'de_DE', 'el_GR', 'it_IT', 'pt_PT', 'sr_RS', 'es_ES'];
        if(langs.indexOf(lang) <= -1){
            lang = 'en_GB';
        }

        // language specific fields
        doc['title_' + lang] = (rev.title) ? rev.title : '';
        doc['description_' + lang] = (deckObj.description) ? deckObj.description : '';

        return doc;
    });

    return solrClient.addDocs(newDocs);
}

function updateDeck(deckObj){
    if(!deckObj.data.hasOwnProperty('$set')){
        return this.newDeck(deckObj.data);
    }

    return services.deckServiceRequest('deck', deckObj.targetId, newDeck);
}

module.exports = {
    newDeck: newDeck,
    updateDeck: updateDeck
};
