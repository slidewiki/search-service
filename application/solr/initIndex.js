'use strict';

const db = require('../database/databaseConnection'),
    decks = require('./objectCollections/decks'),
    slides = require('./objectCollections/slides'),
    users = require('./objectCollections/users');

function indexDecks(){
    db.getAllFromCollection('decks').then( (dbDecks) => {
        // console.log(decks.length);
        for(let i=0; i<dbDecks.length; i++){
            // console.log(JSON.stringify(dbDecks[i]));
            decks.newDeck(dbDecks[i]);
        }
    }).catch( (err) => {
        reject('in db.getAllFromCollection(decks).' + err);
    });
}

function indexSlides(){
    db.getAllFromCollection('slides').then( (dbSlides) => {
        // console.log(decks.length);
        for(let i=0; i<dbSlides.length; i++){
            // console.log(JSON.stringify(dbSlides[i]));
            slides.newSlide(dbSlides[i]);
        }
    }).catch( (err) => {
        reject('in db.getAllFromCollection(slides).' + err);
    });
}

function indexUsers(){
    db.getAllFromCollection('users').then( (dbUsers) => {
        for(let i=0; i<dbUsers.length; i++){
            users.new(dbUsers[i]);
        }
    }).catch( (err) => {
        reject('in db.getAllFromCollection(users).' + err);
    });
}

module.exports = {

    indexAll: function(collection){
        let promise = new Promise( (resolve, reject) => {

            if(collection === 'decks' || collection === 'all'){
                indexDecks();
            }

            if(collection === 'slides' || collection === 'all'){
                indexSlides();
            }

            if(collection === 'users' || collection === 'all'){
                indexUsers();
            }

            resolve(collection + ' are now indexed in SOLR');
        });
        return promise;
    }
};
