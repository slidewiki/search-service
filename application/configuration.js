/* This module is used for confugrating the SOLR connection*/
'use strict';

const co = require('./common');

//read solr URL from /etc/hosts
let host = 'slidewiki.imis.athena-innovation.gr';
const fs = require('fs');
try {
    const lines = fs.readFileSync('/etc/hosts').toString().split('\n');
    for (let i in lines) {
        if (lines[i].includes('solr')) {
            const entrys = lines[i].split(' ');
            host = entrys[entrys.length - 1];
            console.log('Found solr host. Using ' + host + ' as database host.');
        }
    }
} catch (e) {
    console.log('Exception: Windows or no read rights to read /etc/hosts (bad)');
}

//read solr port from ENV
let port = 8983;
if (!co.isEmpty(process.env.SOLR_CONFIG_PORT)) {
    port = process.env.SOLR_CONFIG_PORT;
    // console.log('Using port ' + port + ' as solr port.');
}

let core = 'swTest';
if (!co.isEmpty(process.env.SOLR_CORE)) {
    core = process.env.SOLR_CORE;
    // console.log('Using core ' + core + ' as solr core.');
}

let path = '/solr';
if (!co.isEmpty(process.env.SOLR_PATH)) {
    path = process.env.SOLR_PATH;
    // console.log('Using path ' + path + ' as solr path.');
}

console.log('Connected with deck-service at: ' + process.env.SERVICE_URL_DECK);
console.log('Connected with user-service at: ' + process.env.SERVICE_URL_USER);

let mongoHost = 'localhost';
try {
    const lines = fs.readFileSync('/etc/hosts').toString().split('\n');
    lines.filter((line) => line.includes('mongodb')).forEach((line) => {
        const entries = line.split(' ');
        mongoHost = entries[entries.length - 1];
        console.log('Found mongodb host. Using ' + mongoHost + ' as database host.');
    });
} catch (e) {
    console.log('Exception: Windows or no read rights to read /etc/hosts (bad)');
}
//read mongo URL from ENV
mongoHost = (!co.isEmpty(process.env.DATABASE_URL)) ? process.env.DATABASE_URL : mongoHost;
if (mongoHost !== 'localhost')
    console.log('Found mongodb host. Using ' + mongoHost + ' as database host.');

let mongoPort = 27017;
if (!co.isEmpty(process.env.DATABASE_PORT)) {
    mongoPort = process.env.DATABASE_PORT;
}

module.exports = {
    solrConfig: {
        HOST: host,
        PORT: port,
        CORE: core,
        PATH: path,
    },
    mongoConfig: {
        HOST: mongoHost,
        PORT: mongoPort,
        SLIDEWIKIDATABASE: 'slidewiki'
    }
};
