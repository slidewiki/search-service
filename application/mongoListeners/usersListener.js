'use strict';

const MongoStream = require('mongo-trigger'),
    mongoConfig = require('../configuration').mongoConfig;
const saveJob = require('../lib/saveJob');
const _ = require('lodash');

function pickAttributes(user) {
    return _.pick(user, '_id', 'username', 'forename', 'surname', 'reviewed', 'suspended', 'deactivated');
}

module.exports = {
    listen: function() {

        // init data stream
        let usersStream = new MongoStream({
            format: 'pretty',
            host: mongoConfig.HOST,
            port: mongoConfig.PORT,
        });

        // watch slides collection
        let usersCollection = mongoConfig.SLIDEWIKIDATABASE + '.users';
        usersStream.watch(usersCollection, (event) => {
            // console.log('\nusers ' + JSON.stringify(event));

            let data = {}, user = {};

            switch (event.operation) {
                case 'insert':

                    user = pickAttributes(event.data);

                    data = {
                        type: 'user', 
                        event: 'insert', 
                        id: user._id, 
                        eventData: user,
                    };
                    break;
                case 'update':
                    // if not $set is given, then handle event as insert
                    if (!event.data.hasOwnProperty('$set')) {
                        data = {
                            type: 'user', 
                            event: 'insert', 
                            id: event.targetId, 
                            eventData: event.data,
                        };

                    // update event
                    } else {

                        user = pickAttributes(event.data.$set);

                        if (_.isEmpty(user)) {
                            return;
                        }

                        data = {
                            type: 'user', 
                            event: 'update', 
                            id: event.targetId, 
                            eventData: user,
                        }; 
                    }
                    break;
            }

            saveJob('searchUpdate', data).catch( (err) => {
                console.warn(err.message);
            });
        });
    }
};
