'use strict';

const solr = require('solr-client'),
  config = require('../configuration').solrConfig,
  request = require('request');

function getSolrParameters(params){
  let solr_params = {};
  let childQ = [];
  let rootQ = [];
  let rootFields = [];

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
    rootFields.push('language:*' + params.language + '*');
  }

  if(params.tags){
    params.tags = encodeURIComponent(escapeSpecialChars(params.tags));
    childQ.push('tags:' + params.tags);
  }

  if(params.revisions === 'false'){
    childQ.push('active:true');
  }

  if(params.entity){
    rootFields.push('kind:' + params.entity);
  }

  if(params.user){
    params.user = encodeURIComponent(escapeSpecialChars(params.user));
    rootFields.push('user:' + params.user);
  }

  if(params.license){
    rootFields.push('license:\"' + params.license +'\"');
  }

  solr_params.rootQ = (rootQ.length > 0) ? rootQ.join(' AND ') + ' AND ' : '';
  solr_params.childQ = (childQ.length > 0 ) ? childQ.join(' AND ') : '*:* ';
  solr_params.rootFQ = (rootFields.length > 0) ? rootFields.join(' AND ') : '';

  return solr_params;
}

function escapeSpecialChars(s){
  let term =  s.replace(/([\+\-!\(\)\{\}\[\]\~\*\?:\\])/g, function(match) {
    return '\\' + match;
  })
  .replace(/&&/g, '\\&\\&')
  .replace(/\|\|/g, '\\|\\|');

  // if odd number of " then escape
  if((term.match(/"/g)||[]).length % 2 !== 0){
    term = term.replace(/"/g, function(match){
      return '\\' + match;
    });
  }
  return term;
}

module.exports = {

  // get results from SOLR
  get: function (params) {
    let promise = new Promise( (resolve, reject) => {

      let solrUri = config.HOST + ':' + config.PORT + config.PATH + '/' + config.CORE  + '/query';
      let solr_params = getSolrParameters(params);

      // if(params.hasOwnProperty('fields')){
      console.log('1');
        // basic query
      let queryString = '?fq=' + solr_params.rootFQ + '&fl=*,revisions:[subquery]&revisions.q=' + solr_params.childQ +
          ' AND {!terms f=solr_parent_id v=$row.solr_id}' +
          '&q=' + solr_params.rootQ + '{!join from=solr_parent_id to=solr_id score=total}' +
          solr_params.childQ +'&rows=50&wt=json';
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
