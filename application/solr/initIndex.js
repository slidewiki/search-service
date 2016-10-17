'use strict';

const db = require('../database/databaseConnection'),
    decks = require('./objectCollections/decks'),
    slides = require('./objectCollections/slides');

module.exports = {

    // parses query string into json params
    indexAll: function(){
        let promise = new Promise( (resolve, reject) => {
            db.getAllFromCollection('decks').then( (dbDecks) => {
                // console.log(decks.length);
                for(let i=0; i<dbDecks.length; i++){
                    // console.log(JSON.stringify(dbDecks[i]));
                    decks.newDeck(dbDecks[i]);
                }
            });
            db.getAllFromCollection('slides').then( (dbSlides) => {
                // console.log(decks.length);
                for(let i=0; i<dbSlides.length; i++){
                    // console.log(JSON.stringify(dbSlides[i]));
                    slides.newSlide(dbSlides[i]);
                }
            });
            resolve('All DB documents are now indexed in SOLR');
        });
        return promise;
    }
};
