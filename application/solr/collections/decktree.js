'use strict';

const { 
    getValue, 
    getLanguageCodes, 
    getFirstLevelContent, 
    isRoot, 
    toSolrIdentifier,
    stringify,
} = require('../lib/util');
const solr = require('../lib/solrClient');
const deckService = require('../../services/deck');
const _ = require('lodash');
const async = require('async');

function getRootDeck(path){
    return path[0];
}

function getAddDocument(deckNode, rootDeck) {
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
        tags: (_.compact(deckNode.tags) || []),
        isRoot: (deckNode.path.length === 1), 
        usage: (rootDeck.hidden) ? [] : stringify(rootDeck),
        roots: rootDeck.id, 
        origin: `deck_${_.min(deckNode.forkGroup)}`, 
        fork_count: deckNode.forkGroup.length, 
        active: !rootDeck.hidden,
        revision_count: deckNode.revisionCount,
    };

    // add language specific fields
    doc[`title_${suffix}`] = getValue(deckNode.title);
    doc[`description_${suffix}`] = getValue(deckNode.description);

    let languageContent = getFirstLevelContent(deckNode.children);
    for (const languageSuffix in languageContent) {
        doc[`content_${languageSuffix}`] = languageContent[languageSuffix]; 
    }

    return doc;
}

function getUpdateDocument(existingDoc, rootDeck){

    // merge usage and roots arrays
    let roots = Array.from(existingDoc.roots || []);
    roots.push(rootDeck.id);

    let usage = Array.from(existingDoc.usage || []);
    if(!rootDeck.hidden){
        usage.push(stringify(rootDeck));
    }
    
    return {
        solr_id: existingDoc.solr_id, 
        usage: { set: _.uniq(usage) }, 
        roots: { set: _.uniq(roots) },

        // atomic update seem to set boolean fields to false, 
        // so we are re-sending them
        isRoot: { set: existingDoc.isRoot }, 
        active: { set: !_.isEmpty(usage) }
    };
}

function getAction(deckNode, existingDoc){

    // no document with the same solr id found
    if(!existingDoc) return 'add';

    if(existingDoc.db_revision_id > deckNode.revision)
        return 'noOp';
    else if(existingDoc.db_revision_id < deckNode.revision)
        return 'add';
    else
        return 'update';
}

async function getNodeDocument(deckNode){
    let solrId = toSolrIdentifier(deckNode);
    let existingDoc = await solr.getById(solrId);

    let rootDeck = getRootDeck(deckNode.path);
    
    let action = getAction(deckNode, existingDoc);

    if(action === 'add') {
        return getAddDocument(deckNode, rootDeck);
    } else if (action === 'update') {
        return getUpdateDocument(existingDoc, rootDeck);
    }
    return;
}

let self = module.exports = {
    index: async function(deckId){

        // we are indexing only decktrees starting from root decks
        let usage = await deckService.getDeckUsage(deckId);   

        if (!_.isEmpty(usage)) {
            return Promise.resolve();
        }

        let docs = [];
        let decktreeNodes = await deckService.getDeckTree(deckId, false);

        for (const deckNode of decktreeNodes) {
            let nodeDoc = await getNodeDocument(deckNode);
            docs.push(nodeDoc);
        }

        return solr.add(docs);
    }, 
};