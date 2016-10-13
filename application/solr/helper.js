'use strict';
const request = require('request'),
  solrClient = require('./solrClient'),
  co = require('../common'),
  microservices = require('../microservices/microservicesConnection'),
  db = require('../database/databaseConnection');


function escapeSpecialChars(s){
  return s.replace(/([\+\-!\(\)\{\}\[\]\^"~\*\?:\\])/g, function(match) {
    return '\\' + match;
  })
  .replace(/&&/g, '\\&\\&')
  .replace(/\|\|/g, '\\|\\|')
  .replace(/'/g, '');
}

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
  getSolrParameters: function(params){
    let solr_params = {};
    let childQ = [];
    let childFilters = [];
    let rootQ = [];
    let rootFilters = [];

    if(params.q){
      params.q = encodeURIComponent(escapeSpecialChars(params.q));
      if(params.fields){
        if(params.fields === 'description'){
          rootQ.push('description:('+ params.q +')');
        }
        else{
          childQ.push(params.fields + ':(' + params.q + ')');
        }
      }
      else{
        childQ.push('('+ params.q +')');
      }
    }

    if(params.language){
      rootFilters.push('language:*' + params.language + '*');
    }

    if(params.tags){
      params.tags = encodeURIComponent(escapeSpecialChars(params.tags));
      childFilters.push('tags:' + params.tags);
    }

    if(params.revisions === 'false'){
      childFilters.push('active:true');
    }

    if(params.entity){
      rootFilters.push('kind:' + params.entity);
    }

    if(params.user){
      params.user = encodeURIComponent(escapeSpecialChars(params.user));
      rootFilters.push('user:' + params.user);
    }

    if(params.license){
      rootFilters.push('license:\"' + params.license +'\"');
    }

    solr_params.rootQ = (rootQ.length > 0) ? rootQ.join(' AND ') : '';
    solr_params.rootFQ = (rootFilters.length > 0) ? rootFilters.join(' AND ') : '';
    solr_params.childQ = (childQ.length > 0 ) ? childQ.join(' AND ') : '*:*';
    solr_params.childFQ = (childFilters.length > 0) ? childFilters.join(' AND ') : '';

    return solr_params;
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
  deleteAll(){
    return solrClient.deleteAll();
  }
};
