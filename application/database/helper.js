/* eslint promise/always-return: "off" */
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
    /* eslint-disable promise/catch-or-return, no-unused-vars*/
    createDatabase: function (dbname) {
        dbname = testDbName(dbname);
        let myPromise = new Promise((resolve, reject) => {
            let db = new Db(dbname, new Server(config.HOST, config.PORT));
            db.open()
                .then((connection) => {
                    connection.collection('test').insertOne({ //insert the first object to know that the database is properly created TODO this is not real test....could fail without your knowledge
                        id: 1,
                        data: {}
                    }, () => {
                        resolve(connection);
                    });
                });
        });
        /* eslint-enable promise/catch-or-return, no-unused-vars */

        return myPromise;
    },

    cleanDatabase: function (dbname) {
        dbname = testDbName(dbname);

        return this.connectToDatabase(dbname)
            .then((db) => {
                const DatabaseCleaner = require('database-cleaner');
                const databaseCleaner = new DatabaseCleaner('mongodb');
                return new Promise((resolve) => databaseCleaner.clean(db, resolve));
            }).catch((error) => {
                throw error;
            });
    },

    connectToDatabase: function (dbname) {
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
    },

    getCollection: function(name) {
        return module.exports.connectToDatabase().then((db) => db.collection(name));
    },

};
