'use strict';

const solrClient = require('../lib/solrClient');
const deckService = require('../../services/deck');

const { stripHTML, getLanguage } = require('../lib/util');
const _ = require('lodash');

function getIndexDoc(dbSlide){
    let slide;
    try{
        slide = parse(dbSlide);
    } catch (err) {
        return Promise.reject(err); 
    }

    let deepUsagePromise = deckService.getSlideDeepUsage(`${slide.db_id}-${slide.db_revision_id}`);
    let usagePromise = deckService.getSlideUsage(`${slide.db_id}-${slide.db_revision_id}`);

    return Promise.all([deepUsagePromise, usagePromise]).then( (res) => {
        slide.usage = res[1].map( (u) => { return `${u.id}-${u.revision}`; });
        slide.parents = res[0].map( (u) => { return `deck_${u.id}`});
        slide.active = !_.isEmpty(slide.usage);

        return slide;
    });



}

// dbSlide slide metadata and only one revision
function parse(dbSlide){
        
    let slideRevision = dbSlide.revisions[0];

    let doc = {
        solr_id: 'slide_' + dbSlide._id + '-' + slideRevision.id,
        db_id: dbSlide._id,
        db_revision_id: slideRevision.id,
        timestamp: dbSlide.timestamp,
        lastUpdate: dbSlide.lastUpdate,
        kind: 'slide',
        language: getLanguage(dbSlide.language),
        // license: dbSlide.license,
        creator: dbSlide.user,
        revision_owner: slideRevision.user,
        contributors: dbSlide.contributors.map( (contr) => { return contr.user; }),
        tags: (slideRevision.tags || []).map( (tag) => { return tag.tagName; }),
        origin: `slide_${dbSlide._id}`, 
    };

    // language specific fields
    doc['title_' + doc.language] = (stripHTML(slideRevision.title) || '');
    doc['content_' + doc.language] =(stripHTML(slideRevision.content) || '');
    doc['speakernotes_' + doc.language] = (stripHTML(slideRevision.speakernotes) || '');

    return doc;
}

let self = module.exports = {
    index: function(dbSlide){
        return getIndexDoc(dbSlide).then( (doc) => {
            // console.log(doc);
            return solrClient.add(doc);
        });
    },

    getIndexDoc: getIndexDoc,

    updateSlide: function(slideUpdateObj){
        if(!slideUpdateObj.data.hasOwnProperty('$set')){
            return newSlide(slideUpdateObj.data);
        }

        return deckService.getSlide(slideUpdateObj.targetId).then( (slide) => {
            return newSlide(slide);
        });
    }
    
};
