'use strict';

const solr = require('solr-client'),
    config = require('../configuration').solrConfig,
    helper = require('./helper'),
    request = require('request');


module.exports = {

    // get results from SOLR
    get: function (params) {
        let promise = new Promise( (resolve, reject) => {

            let solrUri = config.HOST + ':' + config.PORT + config.PATH + '/' + config.CORE  + '/query';
            let solr_params = helper.getSolrParameters(params);

            let queryString = '';

            let rootQ = '';
            // query only child docs
            if(params.hasOwnProperty('fields')){
                rootQ = (solr_params.rootQ !== '') ? solr_params.rootQ + ' AND ' : '';
            }
            // query both parent and child docs
            else{
                rootQ = '(' + solr_params.childQ +' AND (kind:slide OR kind:deck)) OR ';
            }

            let childQAndFQ = solr_params.childQ;
            childQAndFQ += (solr_params.childFQ !== '') ? (' AND ' + solr_params.childFQ) : '';

            queryString =
                '?q=' + rootQ + '{!join from=solr_parent_id to=solr_id score=max v=\'' + childQAndFQ + '\'}' +
                '&fq=' + solr_params.rootFQ +
                '&fl=*,revisions:[subquery]' +
                '&revisions.q=' + solr_params.childQ + ' AND {!terms f=solr_parent_id v=$row.solr_id}' +
                '&revisions.fq=' + solr_params.childFQ +
                // '&revisions.sort=id asc' +
                '&rows=50&wt=json';


            let requestUri = 'http://' + solrUri + queryString;
            // console.log('query: ' + requestUri);
            request({
                uri: requestUri,
                method: 'GET'
            }, (err, response, body) => {

                let numFound = 0;
                let docs = {};
                let solrResponse = {};
                let error = false;

                if(err){
                    reject('in request. URI: ' + requestUri);
                }
                else if(response.statusCode !== 200){
                    reject('in response. URI: ' + requestUri);
                }
                else{
                    solrResponse = JSON.parse(body);

                    // check if all results have at least one child
                    // if not, fetch the active revision (needed for decks that match on root doc)
                    this.checkResponse(solrResponse.response).then( (res) => {

                        for(let i in res){
                            solrResponse.response.docs[res[i].item].revisions = res[i];
                        }
                        resolve(solrResponse.response);
                    }).catch( (error) => {
                        reject('in checkResponse. solrResponse: ' + solrResponse);
                    });
                    // resolve(solrResponse.response);
                }
            });
        });
        return promise;
    },
    checkResponse: function(response){
        let promises = [];

        for (let i in response.docs){
            let curDoc = response.docs[i];

            // if results has no children
            if(curDoc.revisions.numFound === 0){

                // fetch active child
                let query = 'solr_parent_id:' + curDoc.solr_id + ' AND active:true';
                promises.push(this.query(query, i));
            }
        }
        return Promise.all(promises);
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

    query: function(queryString, item){
        let promise = new Promise( (resolve, reject) => {
            let client = solr.createClient(config.HOST, config.PORT, config.CORE, config.PATH);
            let query = client.createQuery().q(queryString);
            client.search(query, function(err, obj){
                if(err){
                    reject(err);
                }else{
                    if(item !== 'undefined'){
                        obj.response.item = item;
                    }
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
                    reject('in request. URI: ' + requestUri);
                }
                else if(response.statusCode !== 200){
                    reject('in response. URI: ' + requestUri);
                }
                else{
                    resolve('All documents are deleted from SOLR Index');
                }
            });
        });
        return promise;
    }
};
