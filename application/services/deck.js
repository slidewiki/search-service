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

    getDeckUsage: function(deckId){
        return rp.get({
            uri: `${Microservices.deck.uri}/deck/${deckId}/usage`, 
            json: true
        });
    },

    getSlideUsage: function(slideId){
        return rp.get({
            uri: `${Microservices.deck.uri}/slide/${slideId}/usage`, 
            json: true
        });
    },

    getForkGroup: function(deckId){
        return rp.get({
            uri: `${Microservices.deck.uri}/deck/${deckId}/forkGroup`, 
            json: true
        });
    },

    getDeckTree: function(deckId){
        return rp.get({
            uri: `${Microservices.deck.uri}/decktree/${deckId}`, 
            json: true
        });
    }
};
