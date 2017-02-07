'use strict';

const solrClient = require('../solrClient'),
    services = require('../../microservices/microservicesConnection');

function newDeck(deckObj){
    let newDocs = deckObj.revisions.map( (rev) => {
        let doc = {
            solr_id: 'deck_' + deckObj._id + '-' + rev.id,
            solr_parent_id: 'deck_' + deckObj._id,
            db_id: deckObj._id,
            db_revision_id: rev.id,
            timestamp: rev.timestamp,
            lastUpdate: deckObj.lastUpdate,
            kind: 'deck',
            language: rev.language,
            license: deckObj.license,
            usage: rev.usage.map( (us) => { return us.id + '-' + us.revision; }),
            creator: deckObj.user,
            revision_owner: rev.user,
            contributors: deckObj.contributors.map( (contr) => { return contr.user; }),
            tags: rev.tags,
            active: ((rev.id === deckObj.active) || (rev.usage.length > 0)) ? true : false
        };

        // if language field is not identified, then set text processing to general
        // (this should not happen in normal execution)
        let lang = rev.language;
        let langs = ['en_GB', 'de_DE', 'el_GR', 'it_IT', 'pt_PT', 'sr_RS', 'es_ES'];
        if(langs.indexOf(lang) <= -1){
            lang = 'general';
        }

        // language specific fields
        doc['title_' + lang] = (rev.title) ? rev.title : '';
        doc['description_' + lang] = (deckObj.description) ? deckObj.description : '';

        return doc;
    });

    return solrClient.addDocs(newDocs);
}

function updateDeck(deckObj){
    if(!deckObj.data.hasOwnProperty('$set')){
        return this.newDeck(deckObj.data);
    }

    return services.deckServiceRequest('deck', deckObj.targetId, newDeck);
}

// function newDeckOld(deckObj){
//     let newDocs = [];
//     // form root document
//     let rootDoc = {};
//     rootDoc.solr_id = 'deck_' + deckDbObj._id;
//     rootDoc._id = deckDbObj._id;
//     rootDoc.kind = 'deck';
//     rootDoc.timestamp = deckDbObj.timestamp;
//     rootDoc.description = deckDbObj.description;
//     // rootDoc.translation = deckDbObj.translation;
//     rootDoc.lastUpdate = deckDbObj.lastUpdate;
//     rootDoc.license = deckDbObj.license;
//     rootDoc.user = deckDbObj.user;
//     rootDoc.contributors = deckDbObj.contributors.map( (contr) => { return contr.user; });
//
//     // rootDoc.tags = deckDbObj.tags;
//     newDocs.push(rootDoc);
//
//     // form deck revision documents
//     for(let i=0; i<deckDbObj.revisions.length; i++){
//         let newRevision = newDeckRevision(deckDbObj._id, deckDbObj.active, deckDbObj.revisions[i]);
//         newDocs.push(newRevision);
//     }
//
//     return solrClient.addDocs(newDocs);
//
// }

// function newDeckRevisionOld(parent_id, active, rev){
//
//     let newDoc = {};
//
//     newDoc.solr_id = 'deck_revision_' + parent_id + '-' + rev.id;
//     newDoc.solr_parent_id = 'deck_' + parent_id;
//     newDoc.id = rev.id;
//     newDoc.parent_id = parent_id;
//     newDoc.kind = 'deck_revision';
//     newDoc.timestamp = rev.timestamp;
//     newDoc.user = rev.user;
//     // newDoc.license = rev.license;
//     newDoc.tags = rev.tags;
//     newDoc.title = rev.title;
//     newDoc.active = ((rev.id === active) || (rev.usage.length > 0)) ? true : false;
//     newDoc.language = rev.language;
//
//     return newDoc;
// }


// function updateDeckOld(deckObj){
//
//
//     // update specified fields
//     if(!deckObj.data.hasOwnProperty('$set')){
//         return this.newDeck(deckObj.data);
//     }
//
//     return services.deckServiceRequest('deck', deckObj.targetId, newDeck);

    // let newDocs = [];
    // let updateObj = {};
    // for(let prop in deckObj.data.$set){
    //     if(prop.indexOf('revisions') >= 0){
    //         for(let i in deckObj.data.$set.revisions){
    //             let rev = deckObj.data.$set.revisions[i];
    //             newDocs.push(
    //                 this.newDeckRevision(deckObj.targetId, deckObj.data.$set.active, rev)
    //             );
    //         }
    //     }
    //     else{
    //         if(prop === 'description' || prop === 'lastUpdate' || prop === 'license'){   //do not store active in root deck
    //             updateObj[prop] = {'set': deckObj.data.$set[prop]};
    //         }
    //         else if(prop === 'contributors'){
    //             updateObj[prop] = {'set': deckObj.data.$set[prop].map( (contr) => { return contr.user; })};
    //         }
    //     }
    // }
    //
    // // change made to root doc
    // if(!co.isEmpty(updateObj)){
    //     updateObj.solr_id = 'deck_' + deckObj.targetId;
    //     newDocs.push(updateObj);
    // }
    //
    // return solrClient.addDocs(newDocs);
// }

module.exports = {
    newDeck: newDeck,
    // newDeckRevision: newDeckRevision,
    updateDeck: updateDeck
};
