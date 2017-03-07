'use strict';

const solrClient = require('../solrClient'),
    services = require('../../microservices/microservicesConnection'),
    helper = require('../helper');


function newSlide(slideObj){
    let newDocs = slideObj.revisions.map( (rev) => {
        let doc = {
            solr_id: 'slide_' + slideObj._id + '-' + rev.id,
            solr_parent_id: 'slide_' + slideObj._id,
            db_id: slideObj._id,
            db_revision_id: rev.id,
            timestamp: slideObj.timestamp,
            lastUpdate: slideObj.lastUpdate,
            kind: 'slide',
            language: slideObj.language,
            license: slideObj.license,
            usage: rev.usage.map( (us) => { return us.id + '-' + us.revision; }),
            creator: slideObj.user,
            revision_owner: rev.user,
            contributors: slideObj.contributors.map( (contr) => { return contr.user; }),
            tags: rev.tags,
            active: (rev.usage.length === 0) ? false : true
        };

        // if language field is not identified, then set text processing to english
        // (this should not happen in normal execution)
        let lang = slideObj.language;
        let langs = ['en_GB', 'de_DE', 'el_GR', 'it_IT', 'pt_PT', 'sr_RS', 'es_ES'];
        if(langs.indexOf(lang) <= -1){
            lang = 'en_GB';
        }

        // language specific fields
        doc['title_' + lang] = (rev.title) ? helper.stripHTML(rev.title) : '';
        doc['content_' + lang] = (rev.content) ? helper.stripHTML(rev.content) : '';
        doc['speakernotes_' + lang] = (rev.speakernotes) ? helper.stripHTML(rev.speakernotes) : '';

        return doc;
    });

    return solrClient.addDocs(newDocs);
}

function updateSlide(slideUpdateObj){
    if(!slideUpdateObj.data.hasOwnProperty('$set')){
        return newSlide(slideUpdateObj.data);
    }

    return services.deckServiceRequest('slide', slideUpdateObj.targetId, newSlide);
}

module.exports = {
    newSlide: newSlide,
    updateSlide: updateSlide
};
