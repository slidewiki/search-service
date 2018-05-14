'use strict';

const solrClient = require('../lib/solrClient');
const deckService = require('../../services/deck');
const { getActiveRevision, getLanguage, isRoot } = require('../lib/util');
const _ = require('lodash');

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
        creator: dbDeck.user,
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
        deck.usage = res[2].filter( (deck) => !deck.hidden).map( (u) => { return `${u.id}-${u.revision}`; });
        deck.roots = res[2].map( (u) => u.id);
        deck.parents = res[0].map( (u) => { return `deck_${u.id}`});
        deck.origin = `deck_${_.min(res[1])}`;
        deck.fork_count = res[1].length;
        deck.active = (deck.isRoot) ? !dbDeck.hidden : !_.isEmpty(deck.usage)
        return deck;
    });
}

function updateDeckVisibility(deck, action, start, rows){
    let deckId = deck._id;
    let activeRevision = getActiveRevision(deck);

    return solrClient.getDeckContents(deckId, start, rows).then( (response) => {
        if(start + rows < response.numFound)
            updateDeckVisibility(deck, action, start + rows, rows);

        return response.docs.map( (doc) => {
            let usage = (doc.usage || []);

            if (action === 'show') {
                usage.push(`${deckId}-${activeRevision.id}`);
            } else {
                usage = usage.filter( (item) => !item.startsWith(deckId.toString()));
            }
            usage = _.uniq(usage);

            return {
                solr_id: doc.solr_id, 
                usage: { set: usage },
                active: !_.isEmpty(usage)
            };
        });
    }).then( (docs) => solrClient.add(docs));
}

function checkDeckVisibility(docs, deck){
    if (!_.isEmpty(docs) && docs[0].active === true && deck.hidden === true) {
        return 'hide';
    } else if (!_.isEmpty(docs) && docs[0].active === false && deck.hidden === false) {
        return 'show';
    }
    return;
}

let self = module.exports = {
    index: function(dbDeck){
        let updateContentsPromise;
        if(!isRoot(dbDeck)) {
            updateContentsPromise = Promise.resolve();
        } else {
            updateContentsPromise = solrClient.getById('deck', dbDeck._id).then( (docs) => {
                let action = checkDeckVisibility(docs, dbDeck);
                if(!action) return Promise.resolve();

                let start = 0, rows = 50;
                return updateDeckVisibility(dbDeck, action, start, rows); 
            });
        }

        let updateDeckPromise = prepareDocument(dbDeck).then( (deckDoc) => {
            return solrClient.add(deckDoc);
        });
        
        return Promise.all([updateDeckPromise, updateContentsPromise]);
    }, 

    update: function(deckEvent){
        if(!deckEvent.data.hasOwnProperty('$set')){
            return self.index(deckEvent.data);
        }

        return deckService.getDeck(deckEvent.targetId).then( (dbDeck) => {
            return self.index(dbDeck);
        });
    }, 

    archive: function(deckId){
        let solrDeckId = `deck_${deckId}`;

        let deleteContentsPromise = solrClient.delete(`parents:${solrDeckId}`);
        let deleteRootPromise = solrClient.delete(`solr_id:${solrDeckId}`);

        return Promise.all([deleteRootPromise, deleteContentsPromise]);
    }

};
