'use strict';

const MongoStream = require('mongo-trigger'),
  //solr = require('./solr/solrClient'),
  helper = require('../solr/helper'),
  mongoConfig = require('../configuration').mongoConfig;;

module.exports = {
  listen: function(){

    // init data stream
    let decksStream = new MongoStream({
      format: 'pretty',
      host: mongoConfig.HOST,
      port: mongoConfig.PORT,
    });

    // watch decks collection
    let deckCollection = mongoConfig.SLIDEWIKIDATABASE + '.decks';
    decksStream.watch(deckCollection, function(event) {
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
