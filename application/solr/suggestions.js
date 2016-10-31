'use strict';

const solrClient = require('./solrClient');

module.exports = {

    // parses query string into json params
    findUsers: function(q){
        let promise = new Promise( (resolve, reject) => {
            let queryString = 'defType=edismax' +
                    '&q=' + q + '*' +
                    '&fq=kind:user' +
                    '&qf=username^10 surname forename email organization _text_' +  //boost username match
                    '&fl=_id username' +
                    '&rows=10&wt=json';

            // console.log(queryString);

            solrClient.query(queryString).then( (res) => {
                resolve(res);
            }).catch( (err) => {
                reject(err);
            });
        });
        return promise;
    }
};
