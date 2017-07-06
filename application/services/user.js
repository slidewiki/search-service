'use strict';

const rp = require('request-promise');
const Microservices = require('../configs/microservices.js');

let self = module.exports = {
    getUsernames: function(userIds){
        return rp.post({
            uri: `${Microservices.user.uri}/users`,
            body: userIds, 
            json: true
        });
    }
};
