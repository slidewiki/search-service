'use strict';

const solrClient = require('../solrClient'),
    microservices = require('../../microservices/microservicesConnection'),
    co = require('../../common');

function newDeck(deckDbObj){
    let newDocs = [];
    // form root document
    let rootDoc = {};
    rootDoc.solr_id = 'deck_' + deckDbObj._id;
    rootDoc._id = deckDbObj._id;
    rootDoc.kind = 'deck';
    rootDoc.timestamp = deckDbObj.timestamp;
    rootDoc.description = deckDbObj.description;
    // rootDoc.translation = deckDbObj.translation;
    rootDoc.lastUpdate = deckDbObj.lastUpdate;
    rootDoc.license = deckDbObj.license;
    rootDoc.user = deckDbObj.user;
    rootDoc.contributors = deckDbObj.contributors.map( (contr) => { return contr.user; });

    // rootDoc.tags = deckDbObj.tags;
    newDocs.push(rootDoc);

    // form deck revision documents
    for(let i=0; i<deckDbObj.revisions.length; i++){
        let newRevision = newDeckRevision(deckDbObj._id, deckDbObj.active, deckDbObj.revisions[i]);
        newDocs.push(newRevision);
    }

    return solrClient.addDocs(newDocs);
}

function newDeckRevision(parent_id, active, rev){

    let newDoc = {};

    newDoc.solr_id = 'deck_revision_' + parent_id + '-' + rev.id;
    newDoc.solr_parent_id = 'deck_' + parent_id;
    newDoc.id = rev.id;
    newDoc.parent_id = parent_id;
    newDoc.kind = 'deck_revision';
    newDoc.timestamp = rev.timestamp;
    newDoc.user = rev.user;
    // newDoc.license = rev.license;
    newDoc.tags = rev.tags;
    newDoc.title = rev.title;
    newDoc.active = ((rev.id === active) || (rev.usage.length > 0)) ? true : false;
    newDoc.language = rev.language;

    return newDoc;
}


function updateDeck(deckObj){
    let newDocs = [];

    // update specified fields
    if(!deckObj.data.hasOwnProperty('$set')){
        return this.newDeck(deckObj.data);
    }

    let updateObj = {};
    for(let prop in deckObj.data.$set){
        if(prop.indexOf('revisions') >= 0){
            for(let i in deckObj.data.$set.revisions){
                let rev = deckObj.data.$set.revisions[i];
                newDocs.push(
                    this.newDeckRevision(deckObj.targetId, deckObj.data.$set.active, rev)
                );
            }
        }
        else{
            if(prop === 'description' || prop === 'lastUpdate' || prop === 'license'){   //do not store active in root deck
                updateObj[prop] = {'set': deckObj.data.$set[prop]};
            }
        }
    }

    // change made to root doc
    if(!co.isEmpty(updateObj)){
        updateObj.solr_id = 'deck_' + deckObj.targetId;
        newDocs.push(updateObj);
    }

    return solrClient.addDocs(newDocs);
}

module.exports = {
    newDeck: newDeck,
    newDeckRevision: newDeckRevision,
    updateDeck: updateDeck
};
