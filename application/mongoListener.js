'use strict';

const MongoStream = require('mongo-trigger'),
  //solr = require('./solr/solrClient'),
  helper = require('./solr/helper'),
  mongoConfig = require('./configuration').mongoConfig;;

module.exports = {
  listen: function(){
    console.log('Trying to initiate mongo listener...');
    // init data streams
    let slidesStream = new MongoStream({
      format: 'pretty',
      host: mongoConfig.HOST,
      port: mongoConfig.PORT,
    });

    let decksStream = new MongoStream({
      format: 'pretty',
      host: mongoConfig.HOST,
      port: mongoConfig.PORT,
    });

    // watch slides collection
    let slideCollection = mongoConfig.SLIDEWIKIDATABASE + '.slides';
    slidesStream.watch(slideCollection, function*(event) {
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

    // watch decks collection
    let deckCollection = mongoConfig.SLIDEWIKIDATABASE + '.decks';
    decksStream.watch(deckCollection, function*(event) {
      console.log('\ndeck ' + JSON.stringify(event));

      switch(event.operation){
        case 'insert':
          helper.newDeck(event.data);
          break;
        case 'update':
          helper.updateDeck(event);
          // console.log("update decks " + JSON.stringify(newDoc));
          // solr.addDocs(newDoc).then( (result) => solr.commit() );
          break;
      }
    });
  }
};
