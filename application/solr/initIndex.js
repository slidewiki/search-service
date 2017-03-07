'use strict';

const db = require('../database/databaseConnection'),
    decks = require('./objectCollections/decks'),
    slides = require('./objectCollections/slides'),
    users = require('./objectCollections/users');


function index(indexFunction, arr, el){
    if(arr.length === el)
        return;

    indexFunction(arr[el]).then( (res) => {
        // console.log(res);
        index(indexFunction, arr, ++el);
    }).catch( (err) => {
        console.log(err);
        index(indexFunction, arr, ++el);
    });
}

function indexDecks(){
    db.getAllFromCollection('decks').then( (dbDecks) => {
        index(decks.newDeck, dbDecks, 0);
    }).catch( (err) => {
        console.log('in db.getAllFromCollection(decks).' + err);
    });
}

function indexSlides(){
    db.getAllFromCollection('slides').then( (dbSlides) => {
        index(slides.newSlide, dbSlides, 0);
    }).catch( (err) => {
        console.log('in db.getAllFromCollection(slides).' + err);
    });
}

function indexUsers(){
    db.getAllFromCollection('users').then( (dbUsers) => {
        index(users.new, dbUsers, 0);
    }).catch( (err) => {
        console.log('in db.getAllFromCollection(users).' + err);
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

            resolve(collection + ' are being indexed in SOLR');
        });
        return promise;
    }
};
