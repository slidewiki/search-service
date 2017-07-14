'use strict';

const solrClient = require('../lib/solrClient');
const deckService = require('../../services/deck');
const { getActiveRevision, getLanguage } = require('../lib/util');
const _ = require('lodash');
// const slidesCollection = require('./slides');
// const async = require('async');

function prepareDocument(dbDeck){

    // transform deck database object
    let activeRevision = getActiveRevision(dbDeck);
    if(!activeRevision) return Promise.reject(`#Error: cannot find active revision of deck ${dbDeck._id}`);

    let deck = {
        solr_id: `deck_${dbDeck._id}`,
        db_id: dbDeck._id,
        db_revision_id: activeRevision.id,
        kind:'deck',
        timestamp: dbDeck.timestamp,
        lastUpdate: dbDeck.lastUpdate,
        language: getLanguage(activeRevision.language),
        // license: dbDeck.license,
        usage: activeRevision.usage.map( (u) => { return u.id + '-' + u.revision; }),
        creator: dbDeck.user,
        revision_owner: activeRevision.user,
        contributors: dbDeck.contributors.map( (contr) => { return contr.user; }),
        tags: (activeRevision.tags || []).map( (tag) => { return tag.tagName; }),
        revision_count: dbDeck.revisions.length
    };

    // add language specific fields
    deck['title_' + deck.language] = (activeRevision.title || '');
    deck['description_' + deck.language] = (dbDeck.description || '');

    // fill extra metadata from other services
    let deepUsagePromise = deckService.getDeckDeepUsage(`${deck.db_id}-${deck.db_revision_id}`);
    let forkGroupPromise = deckService.getForkGroup(deck.db_id);
    let rootDecksPromise = deckService.getDeckRootDecks(`${deck.db_id}-${deck.db_revision_id}`);

    return Promise.all([deepUsagePromise, forkGroupPromise, rootDecksPromise]).then( (res) => {
        deck.isRoot = _.isEmpty(res[0]);
        deck.usage = res[2].map( (u) => { return `${u.id}-${u.revision}`; });
        deck.parents = res[0].map( (u) => { return `deck_${u.id}`});
        deck.origin = `deck_${_.min(res[1])}`;
        deck.fork_count = res[1].length;
        deck.active = (deck.isRoot || !_.isEmpty(deck.usage));
        return deck;
    });
}

let self = module.exports = {
    index: function(dbDeck){
        
        return prepareDocument(dbDeck).then( (deckDoc) => {
            return solrClient.add(deckDoc);
        });
    }, 

    update: function(deckEvent){
        if(!deckEvent.data.hasOwnProperty('$set')){
            return self.index(deckEvent.data);
        }

        return deckService.getDeck(deckEvent.targetId).then( (dbDeck) => {
            return self.index(dbDeck);
        });
    }, 

};
