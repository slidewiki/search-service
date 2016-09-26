'use strict';

const Db = require('mongodb').Db,
  Server = require('mongodb').Server,
  MongoClient = require('mongodb').MongoClient,
  config = require('../configuration.js').mongoConfig,
  co = require('../common');

let dbConnection = undefined;

function testDbName(name) {
  return typeof name !== 'undefined' ? name : config.SLIDEWIKIDATABASE;
}

function testConnection(dbname) {
  if (!co.isEmpty(dbConnection)) { //TODO test for alive
    if (dbConnection.s.databaseName === dbname)
      return true;
    else {
      dbConnection.close();
      dbConnection = undefined;
      return false;
    }
  }
  return false;
}

module.exports = {
  connectToDatabase: function(dbname) {
    dbname = testDbName(dbname);

    if (testConnection(dbname))
      return Promise.resolve(dbConnection);
    else
    return MongoClient.connect('mongodb://' + config.HOST + ':' + config.PORT + '/' + dbname)
    .then((db) => {
      if (db.s.databaseName !== dbname)
        throw new 'Wrong Database!';
      dbConnection = db;
      return db;
    });
  }
};
