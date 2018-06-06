'use strict';

const MongoStream = require('mongo-trigger'),
    users = require('../solr/collections/users'),
    mongoConfig = require('../configuration').mongoConfig;
const saveJob = require('../lib/saveJob');

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

            let data = {};

            switch (event.operation) {
                case 'insert':
                    data = {
                        type: 'user', 
                        event: 'insert', 
                        id: event.data._id, 
                        eventData: event.data,
                    };
                    break;
                case 'update':
                    data = {
                        type: 'user', 
                        event: 'update', 
                        id: event.targetId, 
                        eventData: event,
                    };
                    break;
            }

            saveJob('searchUpdate', data).catch( (err) => {
                console.warn(err.message);
            });
        });
    }
};
