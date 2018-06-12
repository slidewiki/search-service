'use strict';

const MongoStream = require('mongo-trigger'),
    decks = require('../solr/collections/decks'),
    mongoConfig = require('../configuration').mongoConfig;
const saveJob = require('../lib/saveJob');

module.exports = {
    listen: function() {

        // init data stream
        let decksStream = new MongoStream({
            format: 'pretty',
            host: mongoConfig.HOST,
            port: mongoConfig.PORT,
        });

        // watch decks collection
        let deckCollection = mongoConfig.SLIDEWIKIDATABASE + '.decks';
        decksStream.watch(deckCollection, (event) => {
            // console.log('\ndeck ' + JSON.stringify(event));

            let data = {};

            switch (event.operation) {
                case 'insert':
                    data = {
                        type: 'deck',
                        event: 'insert', 
                        id: event.data._id, 
                        eventData: event.data,
                    };
                    break;
                case 'update':
                    data = {
                        type: 'deck',
                        event: 'update', 
                        id: event.targetId, 
                    };
                    break;
                case 'delete':
                    data = {
                        type: 'deck',
                        event: 'delete', 
                        id: event.targetId, 
                    };
                    break;
            }

            saveJob('searchUpdate', data).catch( (err) => {
                console.warn(err.message);
            });
        });
    }
};
