'use strict'

const solrClient = require('../solrClient'),
  microservices = require('../../microservices/microservicesConnection'),
  helper = require('../helper'),
  co = require('../../common');;

module.exports = {
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
      solrClient.getById('slide_revision_' + slideDbObj._id + '-' + slideDbObj.revisions[i].id).then( (res) => {
        if(res.numFound > 0){
          this.updateSlideRevision(slideDbObj._id, slideDbObj.revisions[i]);
        }
        else{
          this.newSlideRevision(slideDbObj._id, slideDbObj.revisions[i]);
        }
      });
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
      newDoc.title = (rev.title) ? helper.stripHTML(rev.title) : '';
      newDoc.content = (rev.content) ? helper.stripHTML(rev.content) : '';
      newDoc.speakernotes = (rev.speakernotes) ? helper.stripHTML(rev.speakernotes) : '';
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
      'title': { 'set': rev.title },
      'active': { 'set': active },
      'usage': usage_arr
    };
    solrClient.addDocs(updateObj).then( (result) => solrClient.commit() );
  },

};
