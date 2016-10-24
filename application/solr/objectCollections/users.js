'use strict';

const solrClient = require('../solrClient'),
    // microservices = require('../../microservices/microservicesConnection'),
    co = require('../../common');

module.exports = {

    new: function(userDbObj){
        // form root doc
        let rootDoc = {};
        rootDoc.solr_id = 'user_' + userDbObj._id;
        rootDoc._id = userDbObj._id;
        rootDoc.username = userDbObj.username;
        rootDoc.surname = userDbObj.surname;
        rootDoc.forename = userDbObj.forename;
        rootDoc.email = userDbObj.email;
        rootDoc.organization = userDbObj.organization;
        rootDoc.kind = 'user';

        // console.log('new ' + JSON.stringify(rootDoc));
        solrClient.addDocs(rootDoc).then( (result) => solrClient.commit() );
    },

    update: function(userDbObj){
        // update specified fields
        if(!userDbObj.data.hasOwnProperty('$set')){
            this.new(userDbObj.data);
        }
        else{
            let updateObj = {};
            for(let prop in userDbObj.data.$set){

                if(prop === 'username' ||
                    prop === 'surname' ||
                    prop === 'forename' ||
                    prop === 'email' ||
                    prop === 'organization'){

                    updateObj[prop] = {'set': userDbObj.data.$set[prop]};
                }

            }

            // change made to root doc
            if(!co.isEmpty(updateObj)){
                updateObj.solr_id = 'user_' + userDbObj.targetId;
                // console.log('update ' + JSON.stringify(updateObj));

                solrClient.addDocs(updateObj).then( (result) => solrClient.commit() );
            }
        }
    }

};
