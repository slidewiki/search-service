'use strict';

const MongoStream = require('mongo-trigger'),
    slides = require('../solr/collections/slides'),
    mongoConfig = require('../configuration').mongoConfig;
const saveJob = require('../lib/saveJob');

module.exports = {
    listen: function() {

        // init data stream
        let slidesStream = new MongoStream({
            format: 'pretty',
            host: mongoConfig.HOST,
            port: mongoConfig.PORT,
        });

        // watch slides collection
        let slideCollection = mongoConfig.SLIDEWIKIDATABASE + '.slides';
        slidesStream.watch(slideCollection, (event) => {
            // console.log('\nslide ' + JSON.stringify(event));

            let data = {};

            switch (event.operation) {
                case 'insert':
                    data = {
                        type: 'slide', 
                        event: 'insert', 
                        id: event.data._id, 
                        eventData: event.data,
                    };
                    break;
                case 'update':
                    data = {
                        type: 'slide', 
                        event: 'update', 
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
