'use strict';

const solr = require('solr-client'),
  config = require('../configuration').solrConfig,
  request = require('request');

module.exports = {

  // get results from SOLR
  get: function (params) {
    let promise = new Promise( (resolve, reject) => {

      let solrUri = config.HOST + ':' + config.PORT + config.PATH + '/' + config.CORE  + '/query';
      console.log('edwwwwwwww ' + solrUri);
      let rootQ = '';
      let rootFQ = '';
      let childQ = '';
      let childFQ = '';
      let queryString = '';


      //search keywords in search field
      if(params.hasOwnProperty('fields') && params.fields && params.q !== '*:*'){
        // query root docs for description
        if(params.fields === 'description'){
          rootQ = 'description:' + params.q;
        }
        else{  //else query child docs
          childQ = params.fields + ':*' + params.q + '*';
        }
      }
      else{
        childQ = (params.q === '*:*') ? params.q : ('*' + params.q + '*');
      }

      // filter root docs for language
      if(params.language){
        rootFQ += 'language:*' + params.language + '*';
      }
      // filter child docs for tags
      if(params.tags){
        if(childFQ)  childFQ += ' AND ';
        childFQ += 'tags:*' + params.tags + '*';

        if(childQ)  childQ += ' AND ';
        childQ += 'tags:*' + params.tags + '*';
      }

      if(params.revisions === 'false'){
        if(childFQ)  childFQ += ' AND ';
        childFQ += 'active:true';

        if(childQ)  childQ += ' AND ';
        childQ += 'active:true';
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
      if(params.license){
        if(childFQ)  childFQ += ' AND ';
        childFQ += 'license:"' + params.license + '"';

        if(childQ)  childQ += ' AND ';
        childQ += 'license:"' + params.license + '"';
      }

      if(!rootQ)  rootQ = '*:*';
      if(!childQ) childQ = '*:*';

      // if(params.hasOwnProperty('fields') || params.q === '*:*'){
      // console.log('1');
      // basic query
      queryString = '?fq=' + rootFQ + '&fl=*,revisions:[subquery]&revisions.q=' + childQ +
        ' AND {!terms f=solr_parent_id v=$row.solr_id}&revisions.fq='+ childFQ +
        '&indent=on&q=' + rootQ + ' AND {!join from=solr_parent_id to=solr_id}' + childQ +'&rows=50&wt=json';

      // variation if only child query was given
      if(rootQ === '*:*' && childQ !== ''){
        // console.log('2');

        queryString = '?fq=' + rootFQ + '&fl=*,revisions:[subquery]&revisions.q=' + childQ +
          ' AND {!terms f=solr_parent_id v=$row.solr_id}&revisions.fq='+ childFQ +
          '&indent=on&q={!join from=solr_parent_id to=solr_id}' + childQ +'&rows=50&wt=json';
      }
      // }
      // // search all fields both in root and child docs
      // else{
      //   console.log('3');
      //   // let q = '*' + params.q + '*';
      //   let q = params.q;
      //   childQ = params.q;
      //   if(params.tags){
      //     childQ += ' OR tags:' + params.tags;
      //   }
      //   queryString = '?fq=' + rootFQ + '&fl=*,revisions:[subquery]&revisions.q=' +
      //     ' {!terms f=solr_parent_id v=$row.solr_id}&revisions.fq=' +
      //     '&indent=on&q=('+ q +' OR {!join from=solr_parent_id to=solr_id}'+ childQ + ')' +
      //     ' AND (kind:slide OR kind:deck)&rows=50&wt=json';
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
