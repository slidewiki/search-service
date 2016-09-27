/*
Controller for handling mongodb and the data model slide while providing CRUD'ish.
*/

'use strict';

const helper = require('./helper');

module.exports = {
  getAllFromCollection: function(collectionName) {
    return helper.connectToDatabase()
    .then((db) => db.collection(collectionName))
    .then((col) => col.find())
    .then((stream) => stream.toArray());
  }
};
