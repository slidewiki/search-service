'use strict';

const solrClient = require('../lib/solrClient');
const deckService = require('../../services/deck');
const { getActiveRevision, getLanguage } = require('../lib/util');
const _ = require('lodash');
const slidesCollection = require('./slides');
const async = require('async');

function getIndexDoc(deck){
    // get extra metadata from deck service
    let deepUsagePromise = deckService.getDeckDeepUsage(`${deck.db_id}-${deck.db_revision_id}`);
    let forkGroupPromise = deckService.getForkGroup(deck.db_id);
    let usagePromise = deckService.getDeckUsage(`${deck.db_id}-${deck.db_revision_id}`);

    return Promise.all([deepUsagePromise, forkGroupPromise, usagePromise]).then( (res) => {
        deck.isRoot = _.isEmpty(res[0]);
        deck.usage = res[2].map( (u) => { return `${u.id}-${u.revision}`; });
        deck.parents = res[0].map( (u) => { return `deck_${u.id}`});
        deck.origin = `deck_${_.min(res[1])}`;
        deck.fork_count = res[1].length;
        deck.active = (deck.isRoot || !_.isEmpty(deck.usage));
        return deck;
    });
}

function getIndexDocs(dbDeck, includeSlides){

    let docs = [];

    let activeRevision = getActiveRevision(dbDeck);
    if(!activeRevision){
        return Promise.reject(`#Error: cannot find active revision of deck ${dbDeck._id}`); 
    }

    let deck = parse(dbDeck, activeRevision);

    if(!includeSlides){
        return getIndexDoc(deck);
    }


    let slides = activeRevision.contentItems.filter( (item) => { return (item.kind === 'slide'); }).map( (item) => { return item.ref; });

    return new Promise( (resolve, reject) => {
        async.eachSeries(slides, (slide, callback) => {
            deckService.getSlide(`${slide.id}-${slide.revision}`).then( (slideObj) => {
                slidesCollection.getIndexDoc(slideObj).then( (slideDoc) => {
                    docs.push(slideDoc);
                    callback();
                }).catch( (err) => {
                    console.log(err);
                    callback(err);
                });
            });
        }, (err) => {
            if(err){
                reject(err);
            }
            
            return getIndexDoc(deck).then( (doc) => {
                docs.push(doc);
                resolve(docs);
            }).catch( (err) => {
                reject(err);
            });
        });
    });
}

// transfrom database object to solr document
function parse(dbDeck, activeRevision){
    
    let doc = {
        solr_id: `deck_${dbDeck._id}`,
        db_id: dbDeck._id,
        db_revision_id: activeRevision.id,
        kind:'deck',
        timestamp: dbDeck.timestamp,
        lastUpdate: dbDeck.lastUpdate,
        language: getLanguage(activeRevision.language),
        // license: dbDeck.license,
        usage: activeRevision.usage.map( (u) => { return u.id + '-' + u.revision; }),
        creator: dbDeck.user,
        revision_owner: activeRevision.user,
        contributors: dbDeck.contributors.map( (contr) => { return contr.user; }),
        tags: (activeRevision.tags || []).map( (tag) => { return tag.tagName; }),
        revision_count: dbDeck.revisions.length
    };

    // language specific fields
    doc['title_' + doc.language] = (activeRevision.title || '');
    doc['description_' + doc.language] = (dbDeck.description || '');

    return doc;
}

let self = module.exports = {
    index: function(dbDeck, includeSlides=true){
        
        return getIndexDocs(dbDeck, includeSlides).then( (docs) => {
            // console.log(docs);
            return solrClient.add(docs);
        });
    }, 

    updateDeck: function(deckObj){
        if(!deckObj.data.hasOwnProperty('$set')){
            return self.new(deckObj.data);
        }

        return deckService.getDeck(deckObj.targetId).then( (deck) => {
            return self.new(deck);
        });
    }, 

};
