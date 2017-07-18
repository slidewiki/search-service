'use strict';

const solr = require('solr-client'),
    config = require('../../configuration').solrConfig,
    rp = require('request-promise-native'),
    solrUri = `${config.PROTOCOL}://${config.HOST}:${config.PORT}${config.PATH}/${config.CORE}`,
    client = solr.createClient({
        host: config.HOST,
        port: config.PORT,
        core: config.CORE,
        path: config.PATH,
        secure: (config.PROTOCOL === 'https')
    });

module.exports = {
    add: function(data){
        return new Promise( (resolve, reject) => {
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
    },

    commit: function(){
        client.commit();
    },

    query: function(queryString, requestHandler){
        let requestUri = `${solrUri}/${requestHandler}?${queryString}`;

        // console.log(requestUri);
        return rp.get({
            uri: requestUri, 
            json: true
        });
    },

    // delete solr documents by query with commit changes option
    delete: function(query, commit=false){
        return rp.get({
            uri: `${solrUri}/update?stream.body=<delete><query>${query}</query></delete>&commit=${commit}`
        }).then( () => {
            return 'Documents successfully deleted';
        }); 
    }, 
};
