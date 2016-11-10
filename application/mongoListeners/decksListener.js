'use strict';

const MongoStream = require('mongo-trigger'),
    decks = require('../solr/objectCollections/decks'),
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
        decksStream.watch(deckCollection, (event) => {
            // console.log('\ndeck ' + JSON.stringify(event));

            switch(event.operation){
                case 'insert':
                    decks.newDeck(event.data).catch( (err) => {
                        console.log(err);
                    });
                    break;
                case 'update':
                    decks.updateDeck(event).catch( (err) => {
                        console.log(err);
                    });
                    break;
            }
        });
    }
};
