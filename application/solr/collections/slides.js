'use strict';

const solrClient = require('../lib/solrClient');
const deckService = require('../../services/deck');

const { stripHTML, getLanguageCodes, getRevision } = require('../lib/util');
const _ = require('lodash');
// const async = require('async');

function prepareDocument(dbSlide){

    return deckService.getSlideRootDecks(`${dbSlide._id}`).then( (rootDecks) => {
        let rootDecksByRevision = _.groupBy(rootDecks, 'using');

        return deckService.getSlideDeepUsage(`${dbSlide._id}`).then( (deepUsage) => {
            let deepUsageByRevision = _.groupBy(deepUsage, 'using');

            let docs = [];

            // prepare solr documents for each active slide revision
            Object.keys(rootDecksByRevision).forEach( (revisionId) => {
                let slideRevision = getRevision(dbSlide, parseInt(revisionId));
                if(!slideRevision)  return Promise.reject(`#Error: cannot find revision ${revisionId} of slide ${dbSlide._id}`);
                
                // TODO: examine why deepUsageByRevision[revisionId] can be null - seen from the logs
                if(rootDecksByRevision[revisionId] && deepUsageByRevision[revisionId]){
                    let revisionDoc = prepareSlideRevision(dbSlide, slideRevision, 
                                    rootDecksByRevision[revisionId], deepUsageByRevision[revisionId]);
                    docs.push(revisionDoc);
                }
            });

            return docs;
        });
    });
}

function prepareSlideRevision(dbSlide, slideRevision, rootDecks, deepUsage){
    let visibleRootDecks = rootDecks.filter( (deck) => !deck.hidden);
    let langCodes = getLanguageCodes(dbSlide.language);

    // transform slide database object
    let slide = {
        solr_id: 'slide_' + dbSlide._id + '-' + slideRevision.id,
        db_id: dbSlide._id,
        db_revision_id: slideRevision.id,
        timestamp: dbSlide.timestamp,
        lastUpdate: dbSlide.lastUpdate,
        kind: 'slide',
        language: langCodes.short,
        creator: dbSlide.user,
        contributors: dbSlide.contributors.map( (contr) => { return contr.user; }),
        tags: (slideRevision.tags || []).map( (tag) => { return tag.tagName; }),
        origin: `slide_${dbSlide._id}`, 
        usage: visibleRootDecks.map( (u) => { return `${u.id}-${u.revision}`; }),
        roots: rootDecks.map( (u) => u.id),
        active: !_.isEmpty(visibleRootDecks),
        parents: deepUsage.map( (u) => { return `deck_${u.id}`; })
    };

    // add language specific fields
    slide['title_' + langCodes.suffix] = (stripHTML(slideRevision.title) || '');
    slide['content_' + langCodes.suffix] =(stripHTML(slideRevision.content) || '');
    slide['speakernotes_' + langCodes.suffix] = (stripHTML(slideRevision.speakernotes) || '');

    return slide;
}

let self = module.exports = {

    index: function(dbSlide){
        return prepareDocument(dbSlide).then( (slideDocs) => {
            return solrClient.add(slideDocs);
        });
    },

    update: function(slideEvent){
        if(!slideEvent.data.hasOwnProperty('$set')){
            return solrClient.delete(`origin:slide_${slideEvent.targetId}`, false).then( () => {
                return self.index(slideEvent.data);
            });
        }

        // delete all revisions of the slide and re-index slide
        return solrClient.delete(`origin:slide_${slideEvent.targetId}`, false).then( () => {
            return deckService.getSlide(slideEvent.targetId).then( (slide) => {
                return self.index(slide);
            });
        });
    }
    
};
