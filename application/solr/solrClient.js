'use strict';

const solr = require('solr-client'),
    config = require('../configuration').solrConfig,
    rp = require('request-promise'),
    solrUri = 'http://' + config.HOST + ':' + config.PORT + config.PATH + '/' + config.CORE,
    client = solr.createClient(config.HOST, config.PORT, config.CORE, config.PATH);


module.exports = {
    addDocs: function(data){
        let promise = new Promise( (resolve, reject) => {
            client.add(data, (err, obj) => {
                if(err){
                    reject('addDocs : ' + JSON.stringify(err) + '\ndata: ' + JSON.stringify(data) + '\n');
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

    query: function(queryString, requestHandler){
        let requestUri = solrUri + '/'+ requestHandler + '?' + queryString;

        return rp.get({uri: requestUri}).then( (response) => {
            return Promise.resolve(JSON.parse(response));
        }).catch( (err) => {
            return Promise.reject(err);
        });
    },

    deleteAll: function(){
        let requestUri = solrUri + '/update?stream.body=<delete><query>*:*</query></delete>&commit=true';

        return rp.get({uri: requestUri}).then( () => {
            return Promise.resolve('All documents are deleted from SOLR Index');
        }).catch( (err) => {
            return Promise.reject(err);
        });
    }
};
