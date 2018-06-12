'use strict';

const solrClient = require('../lib/solrClient');
const deckService = require('../../services/deck');

const { stripHTML, getLanguageCodes, getRevision, getValue } = require('../lib/util');
const _ = require('lodash');

async function prepareDocument(dbSlide){

    let rootDecks = await deckService.getSlideRootDecks(`${dbSlide._id}`);
    let rootDecksByRevision = _.groupBy(rootDecks, 'using');

    let deepUsage = await deckService.getSlideDeepUsage(`${dbSlide._id}`);
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
    slide['title_' + langCodes.suffix] = stripHTML(getValue(slideRevision.title));
    slide['content_' + langCodes.suffix] = stripHTML(getValue(slideRevision.content));
    slide['speakernotes_' + langCodes.suffix] = stripHTML(getValue(slideRevision.speakernotes));

    return slide;
}

let self = module.exports = {

    insert: async function(slide){
        let docs = await prepareDocument(slide);
        return solrClient.add(docs);
    },

    update: async function(slideId){
        await solrClient.delete(`origin:slide_${slideId}`, false);
        let slide = await deckService.getSlide(slideId);
        return self.insert(slide);
    }
    
};
