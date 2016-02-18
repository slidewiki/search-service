'use strict';

//Boom gives us some predefined http codes and proper responses
const boom = require('boom');
//This is a simple database imitation that has to be exchanged in the future
const db = require('../database/dbimitation');

module.exports = {
  //Get Slide from database or return NOT FOUND
  getSlide: function(request, reply) {
    try {
      reply(db.get(encodeURIComponent(request.params.id)));
    } catch (e) {
      reply(boom.notFound());
    }
  },

  //Create Slide with new id and payload or return INTERNAL_SERVER_ERROR
  newSlide: function(request, reply) {
    try {
      let slide = request.payload;
      slide.id = db.getNewID();
      reply(db.insert(slide));
    } catch (e) {
      reply(boom.badImplementation('Something strange happend...try to contact Santa to solve the problem...'));
    }
  },

  //Update Slide with id id and payload or return INTERNAL_SERVER_ERROR
  updateSlide: function(request, reply) {
    try {
      reply(db.update(request.payload));
    } catch (e) {
      reply(boom.badImplementation('Something strange happend...try to contact Santa to solve the problem...'));
    }
  },

  //Get all slides from database
  getSlides: function(request, reply) {
    const promise = database_helper.getAllSlides();
    promise.then((docs) => {
      return reply(docs);
    })
    .catch((error) => {
      console.log('Error', error);
      reply(boom.badImplementation('Something strange happend...try to contact Santa to solve the problem...'));
    });
  }
};