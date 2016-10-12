'use strict';

const slidesListener = require('./mongoListeners/slidesListener'),
  decksListener = require('./mongoListeners/decksListener');

module.exports = {
  slides: function(){
    slidesListener.listen();
  },
  decks: function(){
    decksListener.listen();
  }
};
