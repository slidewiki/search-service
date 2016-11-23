'use strict';

const MongoStream = require('mongo-trigger'),
    users = require('../solr/objectCollections/users'),
    mongoConfig = require('../configuration').mongoConfig;;

module.exports = {
    listen: function(){

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

            switch(event.operation){
                case 'insert':
                    users.new(event.data).catch( (err) => {
                        console.log(err);
                    });
                    break;
                case 'update':
                    users.update(event).catch( (err) => {
                        console.log(err);
                    });
                    break;
            }
        });
    }
};
