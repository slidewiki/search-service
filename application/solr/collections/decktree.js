'use strict';

const util = require('../lib/util');
const solr = require('../lib/solrClient');
const deckService = require('../../services/deck');
const _ = require('lodash');
const async = require('async');

function getDeckDeepUsage(path){
    return path.slice(0, -1).map( (node) => { return `deck_${node.id}`; });
}

function getSlideDeepUsage(path){ 
    return path.map( (node) => { return `deck_${node.id}`; });
}

function getRootDeck(path){
    return path[0];
}

function stringify(node){
    return `${node.id}-${node.revision}`
}

// ------------------- Functions for Deck transformation ---------------------- //

function getDeckAddDoc(decktree, rootDeck, deepUsage, forkGroup){
    let langCodes = util.getLanguageCodes(decktree.language);

    let deckDoc = {
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
        isRoot: (decktree.path.length == 1), 
        usage: (rootDeck.hidden) ? [] : stringify(rootDeck),
        roots: rootDeck.id, 
        parents: deepUsage, 
        origin: `deck_${_.min(forkGroup)}`, 
        fork_count: forkGroup.length, 
        active: !rootDeck.hidden
    };

    // add language specific fields
    deckDoc['title_' + langCodes.suffix] = (decktree.title || '');
    deckDoc['description_' + langCodes.suffix] = (decktree.description || '');
    return deckDoc;
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

function getDeckUpdateDoc(currentDoc, rootDeck, deepUsage, results){
    let existingDoc = results[0];

    // merge usage, roots and parent arrays
    let roots = Array.from(existingDoc.roots || []);
    roots.push(rootDeck.id);

    let usage = Array.from(existingDoc.usage || []);
    if(!rootDeck.hidden){
        usage.push(stringify(rootDeck));

    }
    
    let parents = Array.from(existingDoc.parents || []);
    Array.prototype.push.apply(parents, _.flatten(deepUsage));

    return {
        solr_id: existingDoc.solr_id, 
        usage: { set: _.uniq(usage) }, 
        roots: { set: _.uniq(roots) },
        parents: { set: _.uniq(parents) }, 

        // atomic update seem to set boolean fields to false, 
        // so we are re-sending them
        isRoot: { set: existingDoc.isRoot }, 
        active: { set: !_.isEmpty(usage) }
    };
}

function getDeckDoc(deck){
    return solr.getById('deck', deck.id).then( (results) => {
        return deckService.getForkGroup(deck.id).then( (forkGroup) => {

            let rootDeck = getRootDeck(deck.path);
            let deepUsage = getDeckDeepUsage(deck.path);

            let action = getDeckAction(deck, results);
            if(action === 'add') {
                return getDeckAddDoc(deck, rootDeck, deepUsage, forkGroup);
            } else if (action === 'update') {
                return getDeckUpdateDoc(deck, rootDeck, deepUsage, results);
            }
            return;
        });
    });
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

function getSlideAddDoc(slide, rootDeck, deepUsage){

    let langCodes = util.getLanguageCodes(slide.language);

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
        parents: deepUsage
    };

    // add language specific fields
    slideDoc['title_' + langCodes.suffix] = (util.stripHTML(slide.title) || '');
    slideDoc['content_' + langCodes.suffix] =(util.stripHTML(slide.content) || '');
    slideDoc['speakernotes_' + langCodes.suffix] = (util.stripHTML(slide.speakernotes) || '');

    return slideDoc;
}

function getSlideUpdateDoc(currentDoc, rootDeck, deepUsage, results){
    let existingDoc = results[0];

    // merge usage, roots and parent arrays

    let roots = Array.from(existingDoc.roots || []);
    roots.push(rootDeck.id);

    let usage = Array.from(existingDoc.usage || []);
    if(!rootDeck.hidden){
        usage.push(stringify(rootDeck));
    }
    
    let parents = Array.from(existingDoc.parents || []);
    Array.prototype.push.apply(parents, _.flatten(deepUsage));

    return {
        solr_id: existingDoc.solr_id, 
        usage: { set: _.uniq(usage) }, 
        roots: { set: _.uniq(roots) },
        parents: { set: _.uniq(parents) },

        // atomic update seem to set boolean fields to false, 
        // so we are re-sending them         
        active: { set: !_.isEmpty(usage) }
    };
}

function getSlideDoc(slide){
    return solr.getById('slide', `${slide.id}-${slide.revisionId}`).then( (results) => {
        let rootDeck = getRootDeck(slide.path);
        let deepUsage = getSlideDeepUsage(slide.path);

        return (getSlideAction(slide, results) === 'add') 
                ? getSlideAddDoc(slide, rootDeck, deepUsage) 
                : getSlideUpdateDoc(slide, rootDeck, deepUsage, results);

    });
}

function getDeckTreeDocs(decktree){
    let docs = [];

    return getDeckDoc(decktree).then( (deckDoc) => {

        if(deckDoc) docs.push(deckDoc);

        return new Promise( (resolve, reject) => {
            async.eachOfSeries(decktree.contents, (item, index, callback) => {
                if(!item) return callback(new Error(`Invalid content item at position ${index} of decktree ${decktree.id}`));

                if(item.type === 'deck') {
                    getDeckTreeDocs(item).then( (subDocs) => {
                        Array.prototype.push.apply(docs, subDocs);
                        callback();
                    }).catch(callback);
                } else if (item.type === 'slide') {
                    // form solr slide document
                    getSlideDoc(item).then( (slideDoc) => {
                        docs.push(slideDoc);
                        callback();
                    }).catch(callback);
                }
            }, (err) => {               
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });  
    });
}

let self = module.exports = {
	index: function(deck){

		// we are indexing only decktrees starting from root decks
		if(!util.isRoot(deck)) return Promise.resolve();
		
		return deckService.getDeckTree(deck._id).then( (decktree) => {
			return getDeckTreeDocs(decktree).then( (docs) => {
				return solr.add(docs).then( () => { 
                    return solr.commit();
                });
			});
		});
	}
};