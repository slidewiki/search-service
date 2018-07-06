'use strict';

const rp = require('request-promise-native');
const Microservices = require('../configs/microservices.js');

let self = module.exports = {
    getActivityCount: function(kind, type='like', id){
        return rp.get({
            uri: `${Microservices.user.uri}/activities/${kind}/${id}`,
            qs: {
                metaonly: true, 
                activity_type: (type === 'like') ? 'react' : 'view', 
                all_revisions: true,
            },
            json: true
        });
    }, 
};