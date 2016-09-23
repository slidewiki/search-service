'use strict';

const request = require('request'),
  microservicesConf = require('../configuration').microservices;


module.exports = {
  getFromDeckService: function(entity, id){

    let promise = new Promise( (resolve, reject) => {

      request({
        uri: microservicesConf.deckserviceURI + '/' + entity + '/' + id,
        method: 'GET'
      }, (err, response, body) => {

        if(err){
          reject(err);
        }
        else if(response.statusCode !== 200){
          reject(response.statusCode);
        }
        else{
          resolve(JSON.parse(body));
        }
      });
    });
    return promise;
  },

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
