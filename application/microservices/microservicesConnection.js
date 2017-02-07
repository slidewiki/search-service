'use strict';

const rp = require('request-promise'),
    microservices = require('../configs/microservices.js');


module.exports = {

    // getUsername: function(user_id){
    //     let promise = new Promise( (resolve) => {
    //         request({
    //             uri: microservicesConf.userserviceURI + '/user/' +  user_id,
    //             method: 'GET'
    //         }, (err, response, body) => {
    //
    //             if(err){
    //                 resolve('unknown');
    //             }
    //             else if(response.statusCode !== 200){
    //                 resolve('unknown');
    //             }
    //             else{
    //                 resolve(JSON.parse(body).username);
    //             }
    //         });
    //     });
    //     return promise;
    // }
    deckServiceRequest: function(docType, docId, callback){
        return rp.get({uri: microservices.deck.uri + '/'+ docType + '/' + docId}).then( (doc) => {
            return Promise.resolve(callback(JSON.parse(doc)));
        });
    }
};
