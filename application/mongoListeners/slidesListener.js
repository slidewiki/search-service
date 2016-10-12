'use strict';

const MongoStream = require('mongo-trigger'),
  //solr = require('./solr/solrClient'),
  helper = require('../solr/helper'),
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
    slidesStream.watch(slideCollection, function(event) {
      console.log('\nslide ' + JSON.stringify(event));
      
      switch(event.operation){
        case 'insert':
          helper.newSlide(event.data);
          break;
        case 'update':
          helper.updateSlide(event);
          break;

      }
    });
  }
};
