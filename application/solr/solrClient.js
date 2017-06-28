'use strict';

const solr = require('solr-client'),
    config = require('../configuration').solrConfig,
    rp = require('request-promise'),
    solrUri = config.PROTOCOL + '://' + config.HOST + ':' + config.PORT + config.PATH + '/' + config.CORE,
    client = solr.createClient({
        host: config.HOST,
        port: config.PORT,
        core: config.CORE,
        path: config.PATH,
        secure: (config.PROTOCOL === 'https')
    });

module.exports = {
    addDocs: function(data){
        let promise = new Promise( (resolve, reject) => {
            client.add(data, (err, obj) => {
                if(err){
                    reject({
                        message: err.message, 
                        data: data
                    });
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

        // console.log(requestUri);
        return rp.get({uri: requestUri}).then( (response) => {
            return Promise.resolve(JSON.parse(response));
        }).catch( (err) => {
            return Promise.reject(err);
        });
    },

    deleteAll: function(){
        let requestUri = solrUri + '/update?stream.body=<delete><query>*:*</query></delete>&commit=true';

        return rp.get({uri: requestUri}).then( () => {
            return Promise.resolve('All documents were deleted from SOLR Index');
        }).catch( (err) => {
            return Promise.reject(err);
        });
    }
};
