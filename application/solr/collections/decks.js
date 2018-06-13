'use strict';

const solrClient = require('../lib/solrClient');
const deckService = require('../../services/deck');
const { getActiveRevision, getLanguageCodes, getFirstLevelContent, isRoot, getValue } = require('../lib/util');
const _ = require('lodash');

function prepareDocument(dbDeck){

    // transform deck database object
    let activeRevision = getActiveRevision(dbDeck);
    if(!activeRevision) return Promise.reject(`#Error: cannot find active revision of deck ${dbDeck._id}`);

    let deckId = dbDeck._id;
    let revisionId = activeRevision.id;
    let langCodes = getLanguageCodes(activeRevision.language);

    let deck = {
        solr_id: `deck_${deckId}`,
        db_id: deckId,
        db_revision_id: revisionId,
        kind:'deck',
        timestamp: dbDeck.timestamp,
        lastUpdate: dbDeck.lastUpdate,
        language: langCodes.short,
        creator: dbDeck.user,
        contributors: dbDeck.contributors.map( (contr) => { return contr.user; }),
        tags: (activeRevision.tags || []).map( (tag) => { return tag.tagName; }),
        revision_count: dbDeck.revisions.length
    };

    // add language specific fields
    deck[`title_${langCodes.suffix}`] = getValue(activeRevision.title);
    deck[`description_${langCodes.suffix}`] = getValue(dbDeck.description);

    // fill extra metadata from other services
    let forkGroupPromise = deckService.getForkGroup(deckId);
    let rootDecksPromise = deckService.getDeckRootDecks(`${deckId}-${revisionId}`);
    let deckTreePromise = deckService.getDeckTree(deckId);

    return Promise.all([forkGroupPromise, rootDecksPromise, deckTreePromise]).then( ([forks, roots, decktree]) => {
        deck.isRoot = _.isEmpty(roots);
        deck.usage = roots.filter( (deck) => !deck.hidden).map( (u) => { return `${u.id}-${u.revision}`; });
        deck.roots = roots.map( (u) => u.id);
        deck.origin = `deck_${_.min(forks)}`;
        deck.fork_count = forks.length;
        deck.active = (deck.isRoot) ? !dbDeck.hidden : !_.isEmpty(deck.usage);
        deck[`content_${langCodes.suffix}`] = getFirstLevelContent(decktree);
        return deck;
    });
}

function updateDeckVisibility(deckId, action, start, rows){
    return solrClient.getDeckContents(deckId, start, rows).then( (response) => {
        if(start + rows < response.numFound)
            updateDeckVisibility(deckId, action, start + rows, rows);

        return response.docs.map( (doc) => {
            let usage = (doc.usage || []);

            if (action === 'show') {
                usage.push(deckId.toString());
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
    insert: function(dbDeck){
        let updateContentsPromise;
        if(!isRoot(dbDeck)) {
            updateContentsPromise = Promise.resolve();
        } else {
            updateContentsPromise = solrClient.getById('deck', dbDeck._id).then( (docs) => {
                let action = checkDeckVisibility(docs, dbDeck);
                if(!action) return Promise.resolve();

                let start = 0, rows = 50;
                return updateDeckVisibility(dbDeck._id, action, start, rows); 
            });
        }

        let updateDeckPromise = prepareDocument(dbDeck).then( (deckDoc) => {
            return solrClient.add(deckDoc);
        });
        
        return Promise.all([updateDeckPromise, updateContentsPromise]);
    }, 

    update: async function(deckId){
        let deck = await deckService.getDeck(deckId);
        return self.insert(deck);
    }, 

    archive: function(deckId){
        let solrDeckId = `deck_${deckId}`;

        let deleteContentsPromise = solrClient.delete(`roots:${solrDeckId}`);
        let deleteRootPromise = solrClient.delete(`solr_id:${solrDeckId}`);

        return Promise.all([deleteRootPromise, deleteContentsPromise]);
    }

};
