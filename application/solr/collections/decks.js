'use strict';

const solr = require('../lib/solrClient');
const deckService = require('../../services/deck');
const { 
    getLanguageCodes, 
    getFirstLevelContent, 
    getValue,
    toSolrIdentifier,
    stringify,
} = require('../lib/util');
const _ = require('lodash');

async function getNodeDocument(deckNode){

    let roots = await deckService.getDeckRootDecks(stringify(deckNode));
    
    let { short, suffix } = getLanguageCodes(deckNode.language);

    let doc = {
        solr_id: toSolrIdentifier(deckNode),
        db_id: deckNode.id,
        db_revision_id: deckNode.revision,
        kind: 'deck',
        timestamp: deckNode.timestamp,
        lastUpdate: deckNode.lastUpdate,
        language: deckNode.variants.current,
        originalVariant: deckNode.variants.original,
        indexedAs: short,
        allVariants: deckNode.variants.all,
        theme: deckNode.theme,
        educationLevel: deckNode.educationLevel,
        firstSlide: deckNode.firstSlide,
        creator: deckNode.owner,
        contributors: deckNode.contributors,
        isRoot: _.isEmpty(roots.filter( (rootDeck) => rootDeck.id !== deckNode.id)), 
        usage: roots.filter( (rootDeck) => !rootDeck.hidden).map( (u) => { return stringify(u); }),
        roots: roots.map( (u) => u.id),
        origin: `deck_${_.min(deckNode.forkGroup)}`, 
        fork_count: deckNode.forkGroup.length, 
        revision_count: deckNode.revisionCount,
    };

    // we want to distinguish topics from simple tags
    // topics are tags with tagType === 'topic' 
    let tagTypes = _.groupBy(deckNode.tags, (t) => (t.tagType || 'none'));
    doc.tags = _.compact(_.map(tagTypes.none || [], 'tagName'));
    doc.topics = _.compact(_.map(tagTypes.topic || [], 'tagName'));

    // if root, check current node for hidden
    // if not root, check usage i.e. the non hidden root decks
    doc.active = (doc.isRoot) ? !deckNode.hidden : !_.isEmpty(doc.usage),
    
    // tag original translation
    doc.isOriginal = (doc.language === doc.originalVariant);

    // add language specific fields
    doc[`title_${suffix}`] = getValue(deckNode.title);
    doc[`description_${suffix}`] = getValue(deckNode.description);

    let languageContent = getFirstLevelContent(deckNode.children);
    for (const languageSuffix in languageContent) {
        doc[`content_${languageSuffix}`] = languageContent[languageSuffix]; 
    }

    return doc;    
}

function updateDeckVisibility(deck, action, start, rows){
    let deckId = deck._id;
    let revisionId = deck.revisionId;

    return solr.getDeckContents(deckId, start, rows).then( (response) => {
        if(start + rows < response.numFound)
            updateDeckVisibility(deck, action, start + rows, rows);

        return response.docs.map( (doc) => {
            let usage = (doc.usage || []);

            if (action === 'show') {
                usage.push(`${deckId}-${revisionId}`);
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
    }).then( (docs) => solr.add(docs));
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
    insert: async function(deckId) {
        let docs = [];
        let decktreeNodes = await deckService.getDeckTree(deckId, true);

        for (const deckNode of decktreeNodes) {
            let nodeDoc = await getNodeDocument(deckNode);
            docs.push(nodeDoc);
        }

        return solr.add(docs);
    }, 

    update: async function(deckId) {

        // delete docs of current deck (original and translations)
        let solrDeckId = `deck_${deckId}_*`;
        await solr.delete(`solr_id:${solrDeckId}`);
    
        let usage = await deckService.getDeckUsage(deckId);

        // index deck and translations
        let promises = [];
        promises.push(self.insert(deckId));

        // if current node is root, we need to check for visibility update
        if (_.isEmpty(usage)) {
            let response = await solr.getDeckVariants(deckId);

            if (response.numFound > 0) {
                let doc = response.docs[0];
                let deck = await deckService.getDeck(deckId);
                let action = checkDeckVisibility(doc, deck);

                // visibility of content nodes needs to be updated 
                if(action) {
                    let deckIds = _.pick(deck, ['_id', 'revisionId']);
                    promises.push(updateDeckVisibility(deckIds, action, 0, 50));
                }
            }
        }        

        return Promise.all(promises);                                                                                                            
    },

    archive: function(deckId){
        let solrDeckId = `deck_${deckId}_*`;

        let deleteContentsPromise = solr.delete(`roots:${deckId}`);
        let deleteRootPromise = solr.delete(`solr_id:${solrDeckId}`);

        return Promise.all([deleteRootPromise, deleteContentsPromise]);
    }

};
