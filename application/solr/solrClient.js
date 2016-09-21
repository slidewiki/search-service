'use strict';

const solr = require('solr-client'),
  config = require('../configuration').solrConfig,
  request = require('request');

module.exports = {

  // get results from SOLR
  get: function (params) {
    let promise = new Promise( (resolve, reject) => {

      let solrUri = config.HOST + ':' + config.PORT + config.PATH + '/' + config.CORE  + '/query';
      let rootQ = '*:*';
      let rootFQ = '';
      let childQ = '*:*';
      let childFQ = '';
      let queryString = '';


      //search keywords in search field
      if(params.hasOwnProperty('fields') && params.fields && params.q !== '*:*'){
        // query root docs for description
        if(params.fields === 'description'){
          rootQ = 'description:' + params.q;
        }
        else{  //else query child docs
          childQ = params.fields + ':' + params.q;
        }
      }

      // filter root docs for language
      if(params.language){
        rootFQ += 'language:*' + params.language + '*';
      }
      // filter root docs for tags
      if(params.tags){
        if(rootFQ)  rootFQ += ' AND ';
        rootFQ += 'tags:*' + params.tags + '*';
      }
      // filter root docs for entities
      if(params.entity){
        if(rootFQ)  rootFQ += ' AND ';
        rootFQ += 'kind:' + params.entity;
      }
      if(params.user){
        if(rootFQ) rootFQ += ' AND ';
        rootFQ += 'user:"' + params.user + '"';
      }
      if(params.hasOwnProperty('fields') || params.q === '*:*'){
        queryString = '?fq=' + rootFQ + '&fl=*,revisions:[subquery]&revisions.q=' + childQ +
          ' AND {!terms f=solr_parent_id v=$row.solr_id}&revisions.fq='+ childFQ +
          '&indent=on&q=' + rootQ + ' AND {!join from=solr_parent_id to=solr_id}' + childQ +'&rows=20&wt=json';
      }
      else{
        queryString = '?fq=' + rootFQ + '&fl=*,revisions:[subquery]&revisions.q=' +
          params.q + 'AND {!terms f=solr_parent_id v=$row.solr_id}&revisions.fq=' +
          '&indent=on&q=('+ params.q +' AND (kind:slide OR kind:deck)) OR {!join from=solr_parent_id to=solr_id}'+ params.q+'&rows=20&wt=json';
      }

      let requestUri = 'http://' + solrUri + queryString;
      console.log(requestUri);
      request({
        uri: requestUri,
        method: 'GET'
      }, (err, response, body) => {

        let numFound = 0;
        let docs = {};
        let solrResponse = {};
        let error = false;
        // console.log('edw ' + JSON.stringify(response));
        if(err){
          reject(err);
        }
        else if(response.statusCode !== 200){
          reject(response.statusCode);
        }
        else{
          solrResponse = JSON.parse(body);
          console.log(solrResponse.response);
          resolve(solrResponse.response);
        }
      });
    });
    return promise;
  },

  addDocs: function(slideObj){
    let promise = new Promise( (resolve, reject) => {

      let client = solr.createClient(config.HOST, config.PORT, 'swTest', config.PATH);

      client.add(slideObj, function(err, obj){
        if(err){
          // console.log(err);
          reject(err);
        }else{
          // console.log(obj);
          resolve(obj);
        }
      });
    });
    return promise;
  },

  commit: function(){
    let client = solr.createClient(config.HOST, config.PORT, 'swTest', config.PATH);
    client.commit();
  },

  getById: function(id){
    let promise = new Promise( (resolve, reject) => {
      let client = solr.createClient(config.HOST, config.PORT, 'swTest', config.PATH);
      var query = client.createQuery().q('solr_id:' + id );
      client.search(query,function(err,obj){
        if(err){
          reject(err);
        }else{
          resolve(obj.response);
        }
      });
    });
    return promise;
  }
};
