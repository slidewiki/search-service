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
        solr_id: `deck_${decktree.id}_${decktree.language}`,
        db_id: decktree.id,
        db_revision_id: decktree.revision,
        kind: 'deck',
        timestamp: decktree.timestamp,
        lastUpdate: decktree.lastUpdate,
        language: langCodes.short,
        creator: decktree.owner,
        contributors: decktree.contributors,
        tags: (_.compact(decktree.tags) || []),
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

    let languageContent = getFirstLevelContent(decktree);
    for (const languageSuffix in languageContent) {
        doc[`content_${languageSuffix}`] = languageContent[languageSuffix]; 
    }

    return doc;
}

function getDeckAction(currentDoc, existingDoc){

    // no document with the same solr id found
    if(!existingDoc) return 'add';

    if(existingDoc.db_revision_id > currentDoc.revision)
        return 'noOp';
    else if(existingDoc.db_revision_id < currentDoc.revision)
        return 'add';
    else
        return 'update';
}

function getDeckUpdateDoc(currentDoc, rootDeck, existingDoc){

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
    let doc = await solr.getById('deck', `${deck.id}_${deck.language}`);
    let forkGroup = await deckService.getForkGroup(deck.id);
    let rootDeck = getRootDeck(deck.path);
    
    let action = getDeckAction(deck, doc);
    if(action === 'add') {
        return getDeckAddDoc(deck, rootDeck, forkGroup);
    } else if (action === 'update') {
        return getDeckUpdateDoc(deck, rootDeck, doc);
    }
    return;
}

// ------------------- Functions for Slide transformation ---------------------- //

function getSlideAction(slide, existingDoc){

    // no document with the same solr id found
    if(!existingDoc) return 'add';

    if(existingDoc.db_id === slide.id 
            && existingDoc.db_revision_id === slide.revision)
        return 'update';
    else 
        return 'add';
}

function getSlideAddDoc(slide, rootDeck){

    let langCodes = getLanguageCodes(slide.language);

    let slideDoc = {
        solr_id: `slide_${slide.id}-${slide.revision}`,
        db_id: slide.id,
        db_revision_id: slide.revision,
        timestamp: slide.timestamp,
        lastUpdate: slide.lastUpdate,
        kind: 'slide',
        language: langCodes.short,
        creator: slide.owner,
        contributors: slide.contributors,
        tags: _.compact(slide.tags),
        origin: `slide_${slide.id}`, 
        usage: (rootDeck.hidden) ? [] : stringify(rootDeck), 
        roots: rootDeck.id,
        active: !rootDeck.hidden, 
    };

    // add language specific fields
    slideDoc['title_' + langCodes.suffix] = getValue(stripHTML(slide.title));
    slideDoc['content_' + langCodes.suffix] = [getValue(stripHTML(slide.content))];
    slideDoc['speakernotes_' + langCodes.suffix] = getValue(stripHTML(slide.speakernotes));

    return slideDoc;
}

function getSlideUpdateDoc(currentDoc, rootDeck, existingDoc){

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

async function getSlideDoc(slide){
    let slideDoc = await solr.getById('slide', `${slide.id}-${slide.revision}`);
    let rootDeck = getRootDeck(slide.path);

    let action = getSlideAction(slide, slideDoc);
    if (action === 'add') {
        return getSlideAddDoc(slide, rootDeck);
    } else if (action === 'update') {
        return getSlideUpdateDoc(slide, rootDeck, slideDoc);
    }
    return;
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
        }
        // } else if (item.type === 'slide') {
        //     let doc = await getSlideDoc(item);
        //     docs.push(doc);
        // }
    }

    return docs;
}

let self = module.exports = {
    index: async function(deck){

        // we are indexing only decktrees starting from root decks
        let usage = await deckService.getDeckUsage(deck._id);
        if (!_.isEmpty(usage)) {
            return Promise.resolve();
        }

        let decktree = await deckService.getDeckTree(deck._id);
        let docs = await getDeckTreeDocs(decktree); 

        for (const variant of decktree.variants.filter( (v) => !v.original)) {
            decktree = await deckService.getDeckTree(deck._id, variant.language);
            decktree.language = variant.language;
            let variantDocs = await getDeckTreeDocs(decktree);
            Array.prototype.push.apply(docs, variantDocs);
        }
    
        return solr.add(docs);
    }
};