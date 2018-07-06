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
const querystring = require('querystring');

let self = module.exports = {
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

    query: function(requestHandler, query){
        let requestUri = `${solrUri}/${requestHandler}?${querystring.stringify(query)}`;

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

    // real-time get via /get queryhandler
    getById: function(type, solrId){
        
        let query = {
            id: `${type}_${solrId}`, 
            wt: 'json'
        };

        return self.query('get', query).then( (result) => {
            return result.doc;
        });
    }, 

    getDeckContents: function(deckId, start, rows){
        let query = {
            q: '*:*', 
            fq: [
                `roots:${deckId}`,
                `!solr_id:deck_${deckId}`
            ], 
            fl: 'solr_id,usage',
            start: start, 
            rows: rows,
            wt: 'json'
        };
        return self.query('select', query).then( (result) => {
            return result.response;
        });
    }
};
