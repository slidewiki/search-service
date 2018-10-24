'use strict';

const solrClient = require('../lib/solrClient');
const deckService = require('../../services/deck');
const { getActiveRevision, getLanguageCodes, getFirstLevelContent, isRoot, getValue } = require('../lib/util');
const _ = require('lodash');

async function prepareDocument(decktree){
    let deckId = decktree.id;

    let forks = await deckService.getForkGroup(deckId);
    let roots = await deckService.getDeckRootDecks(`${deckId}-${decktree.revision}`);
    let langCodes = getLanguageCodes(decktree.language);

    let deck = {
        solr_id: `deck_${deckId}_${decktree.language}`,
        db_id: deckId,
        db_revision_id: decktree.revision,
        kind:'deck',
        timestamp: decktree.timestamp,
        lastUpdate: decktree.lastUpdate,
        language: langCodes.short,
        creator: decktree.user,
        contributors: decktree.contributors,
        tags: (_.compact(decktree.tags) || []),
        isRoot: _.isEmpty(roots.filter( (rootDeck) => rootDeck.id !== deckId)), 
        usage: roots.filter( (rootDeck) => !rootDeck.hidden).map( (u) => { return `${u.id}-${u.revision}`; }),
        roots: roots.map( (u) => u.id),
        origin: `deck_${_.min(forks)}`,
        fork_count: forks.length,
    };

    // if root, check current node for hidden
    // if not root, check usage i.e. the non hidden root decks
    deck.active = (deck.isRoot) ? !decktree.hidden : !_.isEmpty(deck.usage),
    
    // add language specific fields
    deck[`title_${langCodes.suffix}`] = getValue(decktree.title);
    deck[`description_${langCodes.suffix}`] = getValue(decktree.description);

    let languageContent = getFirstLevelContent(decktree);
    for (const languageSuffix in languageContent) {
        deck[`content_${languageSuffix}`] = languageContent[languageSuffix]; 
    }
  
    return deck;        
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

function checkDeckVisibility(doc, deck){
    if (doc && doc.active === true && deck.hidden === true) {
        return 'hide';
    } else if (doc && doc.active === false && deck.hidden === false) {
        return 'show';
    }
    return;
}

let self = module.exports = {
    insert: async function(deck){
        let decktree = await deckService.getDeckTree(deck._id);
        let docs = await prepareDocument(decktree); 

        for (const variant of decktree.variants.filter( (v) => !v.original)) {
            decktree = await deckService.getDeckTree(deck._id, variant.language);
            decktree.language = variant.language;
            let variantDocs = await prepareDocument(decktree);
            Array.prototype.push.apply(docs, variantDocs);
        }
    
        return solrClient.add(docs);
    }, 

    update: async function(deckId){
        
        // delete docs of this deck (original and translations)
        let solrDeckId = `deck_${deckId}_*`;
        await solrClient.delete(`solr_id:${solrDeckId}`);

        // insert new docs for deck (original and translations)
        let deck = await deckService.getDeck(deckId);
        await self.insert(deck);

        // we need to check for visibility update only in root decks
        let usage = await deckService.getDeckUsage(deckId);

        if(!_.isEmpty(usage)) {
            return Promise.resolve();
        }

        // get indexed deck variants and decide if visibility update is needed
        let response = await solrClient.getDeckVariants(deckId);

        if (response.numFound > 0) {
            let doc = response.docs[0];
            let action = checkDeckVisibility(doc, deck);
        
            // no update is needed, visibility not updated
            if(!action) {
                return Promise.resolve();
            }

            // we need to update deck contents' visibility
            let start = 0, rows = 50;
            return updateDeckVisibility(deck, action, start, rows);
        }

        return Promise.resolve();
    }, 

    archive: function(deckId){
        let solrDeckId = `deck_${deckId}_*`;

        let deleteContentsPromise = solrClient.delete(`roots:${deckId}`);
        let deleteRootPromise = solrClient.delete(`solr_id:${solrDeckId}`);

        return Promise.all([deleteRootPromise, deleteContentsPromise]);
    }

};
