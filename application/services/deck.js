'use strict';

const rp = require('request-promise-native');
const Microservices = require('../configs/microservices.js');

let self = module.exports = {
    getDeck: function(deckId){
        return rp.get({
            uri: `${Microservices.deck.uri}/deck/${deckId}`, 
            json: true
        });
    },

    getSlide: function(slideId){
        return rp.get({
            uri: `${Microservices.deck.uri}/slide/${slideId}`, 
            json: true
        });
    },

    getDeckUsage: function(deckId) {
        return rp.get({
            uri: `${Microservices.deck.uri}/deck/${deckId}/usage`, 
            json: true
        });
    }, 

    getDeckDeepUsage: function(deckId){
        return rp.get({
            uri: `${Microservices.deck.uri}/deck/${deckId}/deepUsage`, 
            json: true
        });
    }, 

    getSlideDeepUsage: function(slideId){
        return rp.get({
            uri: `${Microservices.deck.uri}/slide/${slideId}/deepUsage`, 
            json: true
        });
    },

    getDeckRootDecks: function(deckId){
        return rp.get({
            uri: `${Microservices.deck.uri}/deck/${deckId}/rootDecks`, 
            json: true
        });
    },

    getSlideRootDecks: function(slideId){
        return rp.get({
            uri: `${Microservices.deck.uri}/slide/${slideId}/rootDecks`, 
            json: true
        });
    },

    getForkGroup: function(deckId){
        return rp.get({
            uri: `${Microservices.deck.uri}/deck/${deckId}/forkGroup`, 
            json: true
        });
    },

    getDeckTree: function(deckId, firstLevel=false){
        return rp.get({
            uri: `${Microservices.deck.uri}/decktree/${deckId}/export`,
            qs: {
                firstLevel
            },
            json: true
        });
    }
};
