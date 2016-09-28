'use strict';
const request = require('request'),
  solrClient = require('./solrClient'),
  co = require('../common'),
  microservices = require('../microservices/microservicesConnection'),
  db = require('../database/databaseConnection');

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
  stripHTML(htmlString){
    return htmlString.replace(/<\/?[^>]+(>|$)/g, '').replace(/(\r\n|\n|\r)/gm, '');
  },
  indexAll(){
    let promise = new Promise( (resolve, reject) => {
      // index all decks from db
      db.getAllFromCollection('decks').then( (decks) => {
        // console.log(JSON.stringify(decks.length));
        for(let i=0; i<decks.length; i++){
          this.newDeck(decks[i]);
        }
      });

      // index all slides from db
      db.getAllFromCollection('slides').then( (slides) => {
        // console.log(JSON.stringify(decks.length));
        for(let i=0; i<slides.length; i++){
          this.newSlide(slides[i]);
        }
      });
      resolve(200);
    });
    return promise;
  },

  newSlide(slideDbObj){

    microservices.getUsername(slideDbObj.user).then( (username) => {
      // form root doc
      let rootDoc = {};
      rootDoc.solr_id = 'slide_' + slideDbObj._id;
      rootDoc._id = slideDbObj._id;
      rootDoc.user = username;
      rootDoc.kind = 'slide';
      // rootDoc.deck = slideDbObj.deck;
      rootDoc.timestamp = slideDbObj.timestamp;
      rootDoc.lastUpdate = slideDbObj.lastUpdate;
      rootDoc.language = slideDbObj.language;
      rootDoc.license = slideDbObj.license;
      solrClient.addDocs(rootDoc).then( (result) => solrClient.commit() );
    });

    // form child docs
    for(let i=0; i<slideDbObj.revisions.length; i++){
      solrClient.getById('slide_revision_' + slideDbObj._id + '-' + slideDbObj.revisions[i].id).then( (res)=> {
        if(res.numFound > 0){
          this.updateSlideRevision(slideDbObj._id, slideDbObj.revisions[i]);
        }
        else{
          this.newSlideRevision(slideDbObj._id, slideDbObj.revisions[i]);
        }
      });
    }
  },

  newDeck(deckDbObj){

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

  updateSlide(slideUpdateObj){

    if(slideUpdateObj.data.hasOwnProperty('$set')){
      let updateObj = {};
      for(let prop in slideUpdateObj.data.$set){
        if(prop.indexOf('revisions') >= 0){
          for(let i in slideUpdateObj.data.$set.revisions){
            let rev = slideUpdateObj.data.$set.revisions[i];
            solrClient.getById('slide_revision_' + slideUpdateObj.targetId + '-' + rev.id).then( (result) => {
                // update existing slide revision
              if(result.numFound > 0){
                  // console.log('uparxei hdh ' + rev.id);
                this.updateSlideRevision(slideUpdateObj.targetId, rev);
              }
              // new slide revision
              else{
                // console.log('neo rev ' + rev.id);
                this.newSlideRevision(slideUpdateObj.targetId, rev);
              }
            });
            // console.log('edw ' + JSON.stringify(rev));
          }
        }
        else{
          updateObj[prop] = {'set': slideUpdateObj.data.$set[prop]};
        }

      }

      // changes in root slide were made
      if(!co.isEmpty(updateObj)){
        updateObj.solr_id = 'slide_' + slideUpdateObj.targetId;
        solrClient.addDocs(updateObj).then( (result) => solrClient.commit() );
      }
    }
    else{
      this.newSlide(slideUpdateObj.data);
    }

  },
  newDeckRevision(parent_id, active, rev){
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
  newSlideRevision(parent_id, rev){
    microservices.getUsername(rev.user).then( (username) => {
      let newDoc = {};

      newDoc.solr_id = 'slide_revision_' + parent_id + '-' + rev.id;
      newDoc.solr_parent_id = 'slide_' + parent_id;
      newDoc.id = rev.id;
      newDoc.parent_id = parent_id;
      newDoc.kind = 'slide_revision';
      newDoc.timestamp = rev.timestamp;
      newDoc.lastUpdate = rev.lastUpdate;
      newDoc.user = username;
      // newDoc.license = rev.license;
      newDoc.title = (rev.title) ? this.stripHTML(rev.title) : '';
      newDoc.content = (rev.content) ? this.stripHTML(rev.content) : '';
      newDoc.speakernotes = (rev.speakernotes) ? this.stripHTML(rev.speakernotes) : '';
      newDoc.parent_deck = (rev.usage.length === 0) ? '' : rev.usage[0].id + '-' + rev.usage[0].revision;
      newDoc.active = (rev.usage.length === 0) ? false : true;

      let usage_arr = [];
      for(let i in rev.usage){
        usage_arr.push(rev.usage[i].id + '-' + rev.usage[i].revision);
      }
      newDoc.usage = usage_arr;
      // console.log('new slide revision ' + JSON.stringify(newDoc));
      solrClient.addDocs(newDoc).then( (result) => solrClient.commit() );
    });

  },
  updateSlideRevision(parent_id, rev){
    // only usage can change in slide revisions
    let active = (rev.usage.length === 0) ? false : true;
    let usage_arr = [];
    for(let i in rev.usage){
      usage_arr.push(rev.usage[i].id + '-' + rev.usage[i].revision);
    }

    // update doc
    let updateObj = {
      'solr_id': 'slide_revision_' + parent_id + '-' + rev.id,
      'active': { 'set': active },
      'usage': usage_arr
    };
    solrClient.addDocs(updateObj).then( (result) => solrClient.commit() );
  },
  updateDeck(deckObj){
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
        console.log('edw ' + JSON.stringify(updateObj));
        solrClient.addDocs(updateObj).then( (result) => solrClient.commit() );
      }
    }

  }
};
