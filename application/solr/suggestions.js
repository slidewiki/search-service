'use strict';

const solrClient = require('./solrClient');

module.exports = {

    // parses query string into json params
    findUsers: function(q){
        let promise = new Promise( (resolve, reject) => {
            let queryString = 'defType=edismax' +
                    '&q=' + q + '*' +
                    '&fq=kind:user' +
                    '&fl=username' +
                    '';
            solrClient.query(queryString).then( (res) => {
                resolve(res);
            }).catch( (err) => {
                reject(err);
            });
        });
        return promise;
    }
};
