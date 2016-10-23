'use strict';

const MongoStream = require('mongo-trigger'),
    slides = require('../solr/objectCollections/slides'),
    mongoConfig = require('../configuration').mongoConfig;;

module.exports = {
    listen: function(){

        // init data stream
        let slidesStream = new MongoStream({
            format: 'pretty',
            host: mongoConfig.HOST,
            port: mongoConfig.PORT,
        });

        // watch slides collection
        let slideCollection = mongoConfig.SLIDEWIKIDATABASE + '.slides';
        slidesStream.watch(slideCollection, (event) => {
            console.log('\nslide ' + JSON.stringify(event));

            switch(event.operation){
                case 'insert':
                    slides.newSlide(event.data);
                    break;
                case 'update':
                    slides.updateSlide(event);
                    break;
            }
        });
    }
};
