'use strict';

const solrClient = require('../solrClient'),
    microservices = require('../../microservices/microservicesConnection'),
    co = require('../../common');

module.exports = {

    newDeck: function(deckDbObj){
        // form root doc
        microservices.getUsername(deckDbObj.user).then( (username) => {
            let rootDoc = {};
            rootDoc.solr_id = 'deck_' + deckDbObj._id;
            rootDoc._id = deckDbObj._id;
            rootDoc.user = username;
            rootDoc.kind = 'deck';
            // rootDoc.deck = slideDbObj.deck;
            rootDoc.timestamp = deckDbObj.timestamp;
            rootDoc.language = 'en';      //TODO: transfer this to child doc
            rootDoc.description = deckDbObj.description;
            // rootDoc.translation = deckDbObj.translation;
            rootDoc.lastUpdate = deckDbObj.lastUpdate;
            rootDoc.license = deckDbObj.license;
            // rootDoc.tags = deckDbObj.tags;
            solrClient.addDocs(rootDoc).then( (result) => solrClient.commit() );
        });

        // form child docs
        for(let i=0; i<deckDbObj.revisions.length; i++){
            this.newDeckRevision(deckDbObj._id, deckDbObj.active, deckDbObj.revisions[i]);
        }
    },

    newDeckRevision: function(parent_id, active, rev){
        microservices.getUsername(rev.user).then( (username) => {
            let newDoc = {};

            newDoc.solr_id = 'deck_revision_' + parent_id + '-' + rev.id;
            newDoc.solr_parent_id = 'deck_' + parent_id;
            newDoc.id = rev.id;
            newDoc.parent_id = parent_id;
            newDoc.kind = 'deck_revision';
            newDoc.timestamp = rev.timestamp;
            newDoc.user = username;
            // newDoc.license = rev.license;
            newDoc.tags = rev.tags;
            newDoc.title = rev.title;
            newDoc.active = ((rev.id === active) || (rev.usage.length > 0)) ? true : false;

            solrClient.addDocs(newDoc).then( (result) => solrClient.commit() );
        });
    },

    updateDeck: function(deckObj){
        // update specified fields
        if(!deckObj.data.hasOwnProperty('$set')){
            this.newDeck(deckObj.data);
        }
        else{
            let updateObj = {};
            for(let prop in deckObj.data.$set){
                if(prop.indexOf('revisions') >= 0){
                    for(let i in deckObj.data.$set.revisions){
                        let rev = deckObj.data.$set.revisions[i];
                        this.newDeckRevision(deckObj.targetId, deckObj.data.$set.active, rev);
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
                solrClient.addDocs(updateObj).then( (result) => solrClient.commit() );
            }
        }

    }

};
