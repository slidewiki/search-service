'use strict';
const request = require('request'),
  solrClient = require('./solrClient'),
  co = require('../common'),
  microservices = require('../microservices/microservicesConnection');

module.exports = {

  // parses query string into json params
  parse: function(qstr){
    let promise = new Promise( (resolve, reject) => {
      let query = {};

      if(qstr){
        let a = qstr.trim().split('&');
        for (let i = 0; i < a.length; i++) {
          let b = a[i].split('=');

          // handle multiple key values
          if(query.hasOwnProperty(decodeURIComponent(b[0]))){
            let arr = [];
            arr.push(query[decodeURIComponent(b[0])]);
            arr.push(decodeURIComponent(b[1] || ''));
            query[decodeURIComponent(b[0])] = arr;
          }
          else{
            query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
          }
        }
        resolve(query);
      }

    });
    return promise;
  },

  newSlide(slideDbObj){
    let newDocs = [];

    // form root doc
    let rootDoc = {};
    rootDoc.solr_id = 'slide_' + slideDbObj._id;
    rootDoc._id = slideDbObj._id;
    rootDoc.user = slideDbObj.user;
    rootDoc.kind = slideDbObj.kind;
    rootDoc.deck = slideDbObj.deck;
    rootDoc.timestamp = slideDbObj.timestamp;
    rootDoc.language = slideDbObj.language;
    newDocs.push(rootDoc);

    // form child docs
    for(let i=0; i<slideDbObj.revisions.length; i++){
      let rev = slideDbObj.revisions[i];
      let childDoc = {};

      childDoc.solr_id = 'slide_revision_' + slideDbObj._id + '-' + rev.id;
      childDoc.solr_parent_id = 'slide_' + slideDbObj._id;
      childDoc.id = rev.id;
      childDoc.parent_id = slideDbObj._id;
      childDoc.kind = 'slide_revision';
      childDoc.timestamp = rev.timestamp;
      childDoc.user = rev.user;
      childDoc.license = rev.license;
      childDoc.title = rev.title;
      childDoc.content = rev.content;
      childDoc.speakernotes = rev.speakernotes;
      childDoc.parent_deck = rev.usage[0];
      childDoc.active = true;

      newDocs.push(childDoc);
    }

    solrClient.addDocs(newDocs).then( (result) => solrClient.commit() );
  },

  newDeck(deckDbObj){
    let newDocs = [];

    // form root doc
    let rootDoc = {};
    rootDoc.solr_id = 'deck_' + deckDbObj._id;
    rootDoc._id = deckDbObj._id;
    rootDoc.user = deckDbObj.user;
    rootDoc.kind = deckDbObj.kind;
    // rootDoc.deck = slideDbObj.deck;
    rootDoc.timestamp = deckDbObj.timestamp;
    rootDoc.language = deckDbObj.language;
    rootDoc.description = deckDbObj.description;
    // rootDoc.translation = deckDbObj.translation;
    rootDoc.lastUpdate = deckDbObj.lastUpdate;
    rootDoc.tags = deckDbObj.tags;
    newDocs.push(rootDoc);

    // form child docs
    for(let i=0; i<deckDbObj.revisions.length; i++){
      let rev = deckDbObj.revisions[i];
      let childDoc = {};

      childDoc.solr_id = 'deck_revision_' + deckDbObj._id + '-' + rev.id;
      childDoc.solr_parent_id = 'deck_' + deckDbObj._id;
      childDoc.id = rev.id;
      childDoc.parent_id = deckDbObj._id;
      childDoc.kind = 'deck_revision';
      childDoc.timestamp = rev.timestamp;
      childDoc.user = rev.user;
      childDoc.license = rev.license;
      childDoc.title = rev.title;
      childDoc.active = true;

      newDocs.push(childDoc);
    }

    solrClient.addDocs(newDocs).then( (result) => solrClient.commit() );
  },

  updateSlide(slideUpdateObj){

    if(slideUpdateObj.data.hasOwnProperty('$set')){
      let updateObj = {};
      for(let prop in slideUpdateObj.data.$set){
        if(prop.indexOf('revisions') >= 0){
          let revision_index = prop.split('.')[1];
          microservices.getFromDeckService('slide', slideUpdateObj.targetId).then( (slide) => {
            let revision_id = slide.revisions[revision_index].id;
            solrClient.getById('slide_revision_' + slideUpdateObj.targetId + '-' + revision_id).then( (res) => {
              // update existing slide revision
              if(res.numFound > 0){
                this.updateSlideRevision(slideUpdateObj.targetId, revision_id, slideUpdateObj.data.$set[prop]);
              }
              // new slide revision
              else{
                this.newSlideRevision(slideUpdateObj.targetId, slideUpdateObj.data.$set[prop]);
              }
            });
          });
        }
        else{
          updateObj[prop] = {'set': deckObj.data.$set[prop]};
        }

      }
      if(!co.isEmpty(updateObj)){
        updateObj.solr_id = 'deck_' + slideUpdateObj.targetId;
      }
    }
    else{
      this.newSlide(slideUpdateObj.data);
    }

    // let revKeyName = Object.keys(slideUpdateObj.$set)[0];
    // let rev = slideUpdateObj.$set[revKeyName];
    // let newDoc = {};
    //
    // newDoc.solr_id = 'slide_revision_' + parent_id + '-' + rev.id;
    // newDoc.solr_parent_id = 'slide_' + parent_id;
    // newDoc.db_id = rev.id;
    // newDoc.parent_id = parent_id;
    //
    // newDoc.kind = 'slide_revision';
    // newDoc.timestamp = rev.timestamp;
    // newDoc.user = rev.user;
    // newDoc.license = rev.license;
    // newDoc.title = rev.title;
    // newDoc.content = rev.content;
    // newDoc.speakernotes = rev.speakernotes;
    //
    // return newDoc;
  },
  newSlideRevision(parent_id, rev){
    // console.log('edw ' + parent_id + " " + JSON.stringify(slideRevisionObj));
    let newDoc = {};

    newDoc.solr_id = 'slide_revision_' + parent_id + '-' + rev.id;
    newDoc.solr_parent_id = 'slide_' + parent_id;
    newDoc.id = rev.id;
    newDoc.parent_id = parent_id;
    newDoc.kind = 'slide_revision';
    newDoc.timestamp = rev.timestamp;
    newDoc.user = rev.user;
    newDoc.license = rev.license;
    newDoc.title = rev.title;
    newDoc.content = rev.content;
    newDoc.speakernotes = rev.speakernotes;
    newDoc.parent_deck = rev.usage[0];
    newDoc.active = true;

    solrClient.addDocs(newDoc).then( (result) => solrClient.commit() );
  },
  updateSlideRevision(parent_id, revision_id, rev){

  },
  updateDeck(deckObj){
    // order(2);
    // update specified fields
    if(deckObj.data.hasOwnProperty('$set')){
      let updateObj = {'solr_id': 'deck_' + deckObj.targetId};
      for(let prop in deckObj.data.$set){
        updateObj[prop] = {'set': deckObj.data.$set[prop]};
      }
      return updateObj;
    }
    else{   //whole deck was sent as an update
      return this.newDeck(deckObj.data);
    }
  }
};
