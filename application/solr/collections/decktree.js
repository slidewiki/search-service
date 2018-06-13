'use strict';

const { getValue, getLanguageCodes, getFirstLevelContent, stripHTML, isRoot } = require('../lib/util');
const solr = require('../lib/solrClient');
const deckService = require('../../services/deck');
const _ = require('lodash');
const async = require('async');

function getRootDeck(path){
    return path[0];
}

function stringify(node){
    return `${node.id}-${node.revision}`;
}

// ------------------- Functions for Deck transformation ---------------------- //

function getDeckAddDoc(decktree, rootDeck, forkGroup){
    let langCodes = getLanguageCodes(decktree.language);

    let doc = {
        solr_id: `deck_${decktree.id}`,
        db_id: decktree.id,
        db_revision_id: decktree.revisionId,
        kind: 'deck',
        timestamp: decktree.timestamp,
        lastUpdate: decktree.lastUpdate,
        language: langCodes.short,
        creator: decktree.owner,
        contributors: decktree.contributors,
        tags: (decktree.tags || []),
        isRoot: (decktree.path.length === 1), 
        usage: (rootDeck.hidden) ? [] : stringify(rootDeck),
        roots: rootDeck.id, 
        origin: `deck_${_.min(forkGroup)}`, 
        fork_count: forkGroup.length, 
        active: !rootDeck.hidden
    };

    // add language specific fields
    doc[`title_${langCodes.suffix}`] = getValue(decktree.title);
    doc[`description_${langCodes.suffix}`] = getValue(decktree.description);
    doc[`content_${langCodes.suffix}`] = getFirstLevelContent(decktree);

    return doc;
}

function getDeckAction(currentDoc, results){

    // no document with the same solr id found
    if(_.isEmpty(results)) return 'add';
    
    // only one document can be retrieved
    let existingDoc = results[0];

    if(existingDoc.db_revision_id > currentDoc.revisionId)
        return 'noOp';
    else if(existingDoc.db_revision_id < currentDoc.revisionId)
        return 'add';
    else
        return 'update';
}

function getDeckUpdateDoc(currentDoc, rootDeck, results){
    let existingDoc = results[0];

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

async function getDeckDoc(deck){
    let results = await solr.getById('deck', deck.id);
    let forkGroup = await deckService.getForkGroup(deck.id);
    let rootDeck = getRootDeck(deck.path);
    
    let action = getDeckAction(deck, results);
    if(action === 'add') {
        return getDeckAddDoc(deck, rootDeck, forkGroup);
    } else if (action === 'update') {
        return getDeckUpdateDoc(deck, rootDeck, results);
    }
    return;
}

// ------------------- Functions for Slide transformation ---------------------- //

function getSlideAction(slide, results){
    // no document with the same solr id found
    if(_.isEmpty(results)) return 'add';

    // only one document can be retrieved
    let existingDoc = results[0];

    if(existingDoc.db_id === slide.id 
            && existingDoc.db_revision_id === slide.revisionId)
        return 'update';
    else 
        return 'add';
}

function getSlideAddDoc(slide, rootDeck){

    let langCodes = getLanguageCodes(slide.language);

    let slideDoc = {
        solr_id: `slide_${slide.id}-${slide.revisionId}`,
        db_id: slide.id,
        db_revision_id: slide.revisionId,
        timestamp: slide.timestamp,
        lastUpdate: slide.lastUpdate,
        kind: 'slide',
        language: langCodes.short,
        creator: slide.owner,
        contributors: slide.contributors,
        tags: slide.tags,
        origin: `slide_${slide.id}`, 
        usage: (rootDeck.hidden) ? [] : stringify(rootDeck), 
        roots: rootDeck.id,
        active: !rootDeck.hidden, 
    };

    // add language specific fields
    slideDoc['title_' + langCodes.suffix] = getValue(stripHTML(slide.title));
    slideDoc['content_' + langCodes.suffix] = getValue(stripHTML(slide.content));
    slideDoc['speakernotes_' + langCodes.suffix] = getValue(stripHTML(slide.speakernotes));

    return slideDoc;
}

function getSlideUpdateDoc(currentDoc, rootDeck, results){
    let existingDoc = results[0];

    // merge usage, roots and parent arrays

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
        active: { set: !_.isEmpty(usage) }
    };
}

function getSlideDoc(slide){
    return solr.getById('slide', `${slide.id}-${slide.revisionId}`).then( (results) => {
        let rootDeck = getRootDeck(slide.path);

        return (getSlideAction(slide, results) === 'add') 
            ? getSlideAddDoc(slide, rootDeck) 
            : getSlideUpdateDoc(slide, rootDeck, results);
    });
}

async function getDeckTreeDocs(decktree){
    let docs = [];

    let doc = await getDeckDoc(decktree);
    if (doc) {
        docs.push(doc);
    } 

    for (const item of decktree.contents) {
        if (!item) {
            throw new Error(`Invalid content item in decktree ${decktree.id}`);
        }

        if (item.type === 'deck') {
            let subDocs = await getDeckTreeDocs(item);
            Array.prototype.push.apply(docs, subDocs);
        } else if (item.type === 'slide') {
            let doc = await getSlideDoc(item);
            docs.push(doc);
        }
    }

    return docs;
}

let self = module.exports = {
    index: async function(deck){

        // we are indexing only decktrees starting from root decks
        if(!isRoot(deck)) return Promise.resolve();

        let decktree = await deckService.getDeckTree(deck._id);
        let docs = await getDeckTreeDocs(decktree);

        await solr.add(docs);
        return solr.commit();
    }
};