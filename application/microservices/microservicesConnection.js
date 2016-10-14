'use strict';

const request = require('request'),
    microservicesConf = require('../configuration').microservices;


module.exports = {

    getUsername: function(user_id){
        let promise = new Promise( (resolve, reject) => {
            request({
                uri: microservicesConf.userserviceURI + '/user/' +  user_id,
                method: 'GET'
            }, (err, response, body) => {

                if(err){
                    resolve('unknown');
                }
                else if(response.statusCode !== 200){
                    resolve('unknown');
                }
                else{
                    resolve(JSON.parse(body).username);
                }
            });
        });
        return promise;
    }
};
