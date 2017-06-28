/*
Controller for handling mongodb and the data model slide while providing CRUD'ish.
*/

'use strict';

const helper = require('./helper');

module.exports = {
    getAll: function (collection, offset, limit) {
        return helper.connectToDatabase()
        .then((db) => db.collection(collection))
        .then((col) => col.find({}).skip(offset).limit(limit).sort({_id:1}))
        .then((cursor) => cursor.toArray());
    },

    getTotalCount: function(collection){
        return helper.connectToDatabase()
        .then((db) => db.collection(collection))
        .then((col) => col.find({}).count());
    }
};
