'use strict';

const solrClient = require('../lib/solrClient'),
    // microservices = require('../../microservices/microservicesConnection'),
    co = require('../../common');

let self = module.exports = {

    index: function(userDbObj){
        // form root doc
        let rootDoc = {};
        rootDoc.solr_id = 'user_' + userDbObj._id;
        rootDoc.db_id = userDbObj._id;
        rootDoc.username = userDbObj.username;
        rootDoc.surname = userDbObj.surname;
        rootDoc.forename = userDbObj.forename;
        rootDoc.kind = 'user';

        return solrClient.add(rootDoc);
    },

    update: function(userDbObj){
        // update specified fields
        if(!userDbObj.data.hasOwnProperty('$set')){
            return this.index(userDbObj.data);
        }
        
        let updateObj = {};
        for(let prop in userDbObj.data.$set){

            if(prop === 'username' || prop === 'surname' || prop === 'forename'){
                updateObj[prop] = {'set': userDbObj.data.$set[prop]};
            }
        }

        // change made to root doc
        if(!co.isEmpty(updateObj)){
            updateObj.solr_id = 'user_' + userDbObj.targetId;
            return solrClient.add(updateObj);
        }
        else{
            return Promise.resolve();
        }
    }

};
