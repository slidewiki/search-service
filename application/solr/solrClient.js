'use strict';

const solr = require('solr-client'),
    config = require('../configuration').solrConfig,
    request = require('request'),
    solrUri = 'http://' + config.HOST + ':' + config.PORT + config.PATH + '/' + config.CORE  + '/query',
    client = solr.createClient(config.HOST, config.PORT, config.CORE, config.PATH);


module.exports = {
    addDocs: function(data){
        let promise = new Promise( (resolve, reject) => {

            client.add(data, (err, obj) => {
                if(err){
                    reject('addDocs : ' + JSON.stringify(err) + '\ndata: ' + JSON.stringify(data));
                }else{
                    resolve(obj);
                }
            });
        });
        return promise;
    },

    commit: function(){
        client.commit();
    },
    query: function(queryString, item){
        let promise = new Promise( (resolve, reject) => {
            let requestUri = solrUri + '?' + queryString;
            // console.log(requestUri);

            request({
                uri: requestUri,
                method: 'GET'
            }, (err, response, body) => {

                let solrResponse = {};

                if(err){
                    reject('in request. URI: ' + requestUri);
                }
                else if(response.statusCode !== 200){
                    reject('in response. URI: ' + requestUri);
                }
                else{
                    solrResponse = JSON.parse(body);
                    if(item !== 'undefined'){
                        solrResponse.response.item = item;
                    }
                    resolve(solrResponse.response);
                }
            });
        });
        return promise;
    },
    facet: function(queryString){
        let promise = new Promise( (resolve, reject) => {
            let requestUri = solrUri + '?' + queryString;
            // console.log(requestUri);

            request({
                uri: requestUri,
                method: 'GET'
            }, (err, response, body) => {
                // console.log(JSON.stringify(response));
                let solrResponse = {};

                if(err){
                    reject('in request. URI: ' + requestUri);
                }
                else if(response.statusCode !== 200){
                    reject('in response. URI: ' + requestUri);
                }
                else{
                    solrResponse = JSON.parse(body);
                    resolve(solrResponse.facet_counts.facet_fields);
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
            }, (err, response) => {
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
