'use strict';

const solrClient = require('../lib/solrClient');
const deckService = require('../../services/deck');
const util = require('../lib/util');
const _ = require('lodash');
const deck = require('./decks'), 
    slide = require('./slides');
const async = require('async');





let self = module.exports = {
    indexSubtree: function(root){

    }, 

    index: function(dbDeck){

        // check if this is a root deck
        return deck.isRootDeck(dbDeck._id).then( (isRoot) => {
            
            // we are indexing deck trees starting from root decks
            if(!isRoot) return Promise.resolve();

            return deckService.getDeckTree(dbDeck._id).then( (decktree) => {

                let rootDeckPromise = deckService.getDeck(decktree.id).then( (rootDeck) => {
                    return deck.parse(rootDeck);
                });

                // let slidePromises = decktree.children.filter( (c) => { return c.type === 'slide'; }).map( (slideChild) => {

                //     // the slideChild.id also contains the slide revision
                //     return deckService.getSlide(slideChild.id).then( (dbSlide) => {
                //         return slide.parse(dbSlide);
                //     });
                // });

                let decks = decktree.children.filter( (c) => { return c.type === 'deck'; });
                let promises = [rootDeckPromise];
                // promises = promises.concat(slidePromises);

                return Promise.all(promises).then( (docs) => {
                    console.log(docs);
                });
            });
            // let deck;
            // try{
            //      deck = parseDeck(dbDeck);
            // } catch(err) {
            //     return Promise.reject(err);
            // }

            // return getDeckOrigin(dbDeck._id).then( (origin) => { 
            //     deck.origin = `deck_${origin}`;
            //     return solrClient.add(deck);
            // });
        });
    }
};
