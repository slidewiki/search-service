'use strict';

const solr = require('solr-client'),
  config = require('../configuration').solrConfig,
  utils = require('./utils'),
  request = require('request');


module.exports = {

  // get results from SOLR
  get: function (params) {
    let promise = new Promise( (resolve, reject) => {

      let solrUri = config.HOST + ':' + config.PORT + config.PATH + '/' + config.CORE  + '/query';
      let solr_params = utils.getSolrParameters(params);

      // if(params.hasOwnProperty('fields')){
      console.log('1');
      let rootQ = (solr_params.rootQ !== '') ? solr_params.rootQ + ' AND ' : '';
      let childQAndFQ = solr_params.childQ;
      childQAndFQ += (solr_params.childFQ !== '') ? (' AND ' + solr_params.childFQ) : '';

      // basic query
      let queryString =
        '?q=' + rootQ + '{!join from=solr_parent_id to=solr_id score=max v=\'' + childQAndFQ + '\'}' +
        '&fq=' + solr_params.rootFQ +
        '&fl=*,revisions:[subquery]' +
        '&revisions.q=' + solr_params.childQ + ' AND {!terms f=solr_parent_id v=$row.solr_id}' +
        '&revisions.fq=' + solr_params.childFQ +
        '&revisions.sort=id asc' +
        '&rows=50&wt=json';
      // }
      // // search all fields both in root and child docs
      // else{
      //     console.log('3');
      //     // let q = '*' + params.q + '*';
      //     let q = params.q;
      //     childQ = params.q;
      //     if(params.tags){
      //       childQ += ' OR tags:' + params.tags;
      //     }
      //     // queryString = '?fq=' + rootFQ + '&fl=*,revisions:[subquery]&revisions.q=' +
      //     //   ' {!terms f=solr_parent_id v=$row.solr_id}&revisions.fq=' +
      //     //   '&indent=on&q=('+ q +' OR {!join from=solr_parent_id to=solr_id}'+ childQ + ')' +
      //     //   ' AND (kind:slide OR kind:deck)&rows=50&wt=json';
      //
      //
      //   queryString = '?fq=' + rootFQ + '&fl=*,revisions:[subquery]&revisions.q=' +
      //     ' {!terms f=solr_parent_id v=$row.solr_id}&revisions.fq=' +
      //     '&q=(('+ q +' AND {!join from=solr_parent_id to=solr_id}active:true)' +
      //     ' OR ({!join from=solr_parent_id to=solr_id}'+ childQ + ' AND active:true))' +
      //     ' AND (kind:slide OR kind:deck)&rows=50&wt=json';
      //
      // }




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
          reject(response);
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

      let client = solr.createClient(config.HOST, config.PORT, config.CORE, config.PATH);

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
    let client = solr.createClient(config.HOST, config.PORT, config.CORE, config.PATH);
    client.commit();
  },

  getById: function(id){
    let promise = new Promise( (resolve, reject) => {
      let client = solr.createClient(config.HOST, config.PORT, config.CORE, config.PATH);
      let query = client.createQuery().q('solr_id:' + id );
      client.search(query,function(err,obj){
        if(err){
          reject(err);
        }else{
          resolve(obj.response);
        }
      });
    });
    return promise;
  },

  deleteAll: function(){
    let promise = new Promise( (resolve, reject) => {
      let solrUri = config.HOST + ':' + config.PORT + config.PATH + '/' + config.CORE;
      let requestUri = 'http://' + solrUri + '/update?stream.body=<delete><query>*:*</query></delete>&commit=true';

      request({
        uri: requestUri,
        method: 'GET'
      }, (err, response, body) => {
        if(err){
          reject(err);
        }
        else if(response.statusCode !== 200){
          reject(response.statusCode);
        }
        else{
          resolve('200');
        }
      });
    });
    return promise;
  }
};
