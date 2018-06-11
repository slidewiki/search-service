'use strict';

const solrClient = require('../lib/solrClient'),
    co = require('../../common');

let self = module.exports = {

    insert: function(user){

        if((user.reviewed && user.suspended) || (user.deactivated)){
            return Promise.resolve();
        }

        // form root doc
        let rootDoc = {};
        rootDoc.solr_id = 'user_' + user._id;
        rootDoc.db_id = user._id;
        rootDoc.username = user.username;
        rootDoc.surname = user.surname;
        rootDoc.forename = user.forename;
        rootDoc.kind = 'user';

        return solrClient.add(rootDoc);
    },

    update: function(userId, changeSet){

        let updateObj = {};
        let suspendUser = false;

        for(let prop in changeSet){

            if(prop === 'username' || prop === 'surname' || prop === 'forename'){
                updateObj[prop] = {'set': changeSet[prop]};
            }
            else if((prop === 'suspended' || prop === 'deactivated') && changeSet[prop]){
                suspendUser = true;
            }
        }

        // user was either suspended or deactived
        if(suspendUser){
            return solrClient.delete(`solr_id:user_${userId}`, true);
        }
        // update user object in solr
        else if(!co.isEmpty(updateObj)){
            updateObj.solr_id = `user_${userId}`;
            updateObj.kind = 'user';
            return solrClient.add(updateObj);
        }
        else{
            return Promise.resolve();
        }
    }

};
