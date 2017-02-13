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
            timestamp: rev.timestamp,
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

// function newSlide(slideDbObj){
//     let newDocs = [];
//
//     // form root doc
//     let rootDoc = {};
//     rootDoc.solr_id = 'slide_' + slideDbObj._id;
//     rootDoc._id = slideDbObj._id;
//     rootDoc.user = slideDbObj.user;
//     rootDoc.kind = 'slide';
//     rootDoc.timestamp = slideDbObj.timestamp;
//     rootDoc.lastUpdate = slideDbObj.lastUpdate;
//     // rootDoc.language = slideDbObj.language;
//     rootDoc.license = slideDbObj.license;
//     rootDoc.contributors = slideDbObj.contributors.map( (contr) => { return contr.user; });
//     newDocs.push(rootDoc);
//     // form child docs
//     for(let i=0; i<slideDbObj.revisions.length; i++){
//         // solrClient.query('q=solr_id:slide_revision_' + slideDbObj._id + '-' + slideDbObj.revisions[i].id).then( (res) => {
//         //     if(res.numFound > 0){
//         //         // console.log('solr_id:slide_revision_' + slideDbObj._id + '-' + slideDbObj.revisions[i].id + ' is existing');
//         //         this.updateSlideRevision(slideDbObj._id, slideDbObj.revisions[i]);
//         //     }
//         //     else{
//                 // console.log('solr_id:slide_revision_' + slideDbObj._id + '-' + slideDbObj.revisions[i].id + ' is new');
//         let newRevision = newSlideRevision(slideDbObj._id, slideDbObj.revisions[i], slideDbObj.language);
//         newDocs.push(newRevision);
//         //     }
//         // }).catch( (err) => {
//         //     console.log('solrClient.query:' + err);
//         // });
//     }
//
//     return solrClient.addDocs(newDocs);
// }
//
// function updateSlide(slideUpdateObj){
//
//     if(!slideUpdateObj.data.hasOwnProperty('$set')){
//         return newSlide(slideUpdateObj.data);
//     }
//
//     return services.deckServiceRequest('slide', slideUpdateObj.targetId, newSlide);
//     // let newDocs = [];
//     // let updateObj = {};
//     // for(let prop in slideUpdateObj.data.$set){
//     //     if(prop.indexOf('revisions') >= 0){
//     //         for(let i in slideUpdateObj.data.$set.revisions){
//     //             let rev = slideUpdateObj.data.$set.revisions[i];
//     //             // solrClient.query('q=solr_id:slide_revision_' + slideUpdateObj.targetId + '-' + rev.id).then( (result) => {
//     //             //     // update existing slide revision
//     //             //     if(result.numFound > 0){
//     //             //         this.updateSlideRevision(slideUpdateObj.targetId, rev);
//     //             //     }
//     //             //     // new slide revision
//     //             //     else{
//     //             let newRevision = this.newSlideRevision(slideUpdateObj.targetId, rev);
//     //             newDocs.push(newRevision);
//     //             //     }
//     //             // }).catch( (err) => {
//     //             //     console.log('solrClient.query:' + err);
//     //             // });;
//     //         }
//     //     }
//     //     else{
//     //         if(prop === 'contributors'){
//     //             updateObj[prop] = {'set': slideUpdateObj.data.$set[prop].map( (contr) => { return contr.user; })};
//     //         }
//     //         else{
//     //             updateObj[prop] = {'set': slideUpdateObj.data.$set[prop]};
//     //         }
//     //
//     //     }
//     // }
//     //
//     // // changes in root slide were made
//     // if(!co.isEmpty(updateObj)){
//     //     updateObj.solr_id = 'slide_' + slideUpdateObj.targetId;
//     //     newDocs.push(updateObj);
//     // }
//     //
//     // return solrClient.addDocs(newDocs);
// }

// function newSlideRevision(parent_id, rev, language){
//     let newDoc = {};
//
//     newDoc.solr_id = 'slide_revision_' + parent_id + '-' + rev.id;
//     newDoc.solr_parent_id = 'slide_' + parent_id;
//     newDoc.id = rev.id;
//     newDoc.parent_id = parent_id;
//     newDoc.kind = 'slide_revision';
//     newDoc.timestamp = rev.timestamp;
//     newDoc.lastUpdate = rev.lastUpdate;
//     newDoc.user = rev.user;
//     // newDoc.license = rev.license;
//     newDoc.title = (rev.title) ? helper.stripHTML(rev.title) : '';
//     newDoc.content = (rev.content) ? helper.stripHTML(rev.content) : '';
//     newDoc.speakernotes = (rev.speakernotes) ? helper.stripHTML(rev.speakernotes) : '';
//     newDoc.parent_deck = (rev.usage.length === 0) ? '' : rev.usage[0].id + '-' + rev.usage[0].revision;
//     newDoc.active = (rev.usage.length === 0) ? false : true;
//     newDoc.language = language;
//     newDoc.usage = rev.usage.map( (us) => { return us.id + '-' + us.revision; });
//     // let usage_arr = [];
//     // for(let i in rev.usage){
//     //     usage_arr.push(rev.usage[i].id + '-' + rev.usage[i].revision);
//     // }
//     // newDoc.usage = usage_arr;
//
//     return newDoc;
// }

// function updateSlideRevision(parent_id, rev){
//     // only usage can change in slide revisions
//     let active = (rev.usage.length === 0) ? false : true;
//     let usage_arr = [];
//     for(let i in rev.usage){
//         usage_arr.push(rev.usage[i].id + '-' + rev.usage[i].revision);
//     }
//
//     // update doc
//     let updateObj = {
//         'solr_id': 'slide_revision_' + parent_id + '-' + rev.id,
//         'title': { 'set': rev.title },
//         'active': { 'set': active },
//         'usage': usage_arr
//     };
//     solrClient.addDocs(updateObj).then( (result) => solrClient.commit() );
// }
module.exports = {
    newSlide: newSlide,
    updateSlide: updateSlide,
    // newSlideRevision: newSlideRevision,
    // updateSlideRevision: updateSlideRevision
};
