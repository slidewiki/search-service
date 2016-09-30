/* This module is used for confugrating the SOLR connection*/
'use strict';

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
  //Windows or no read rights (bad)
}

//read solr port from ENV
const co = require('./common');
let port = 8983;
if (!co.isEmpty(process.env.SOLR_CONFIG_PORT)){
  port = process.env.SOLR_CONFIG_PORT;
  // console.log('Using port ' + port + ' as solr port.');
}

let core = 'swTest';
if (!co.isEmpty(process.env.SOLR_CORE)){
  core = process.env.SOLR_CORE;
  // console.log('Using core ' + core + ' as solr core.');
}

let path = '/solr';
if (!co.isEmpty(process.env.SOLR_PATH)){
  path = process.env.SOLR_PATH;
  // console.log('Using path ' + path + ' as solr path.');
}

let userserviceURI = 'http://userservice.experimental.slidewiki.org';
if (!co.isEmpty(process.env.SERVICE_URL_USER)){
  userserviceURI = process.env.SERVICE_URL_USER;
}


let mongoHost = 'localhost';
// const fs = require('fs');
const lines = fs.readFileSync('/etc/hosts').toString().split('\n');
for (let i in lines) {
  if (lines[i].includes('mongodb')) {
    const entrys = lines[i].split(' ');
    mongoHost = entrys[entrys.length - 1];
    console.log('Found mongodb host. Using ' + host + ' as database host.');
  }
}

let mongoPort = 27017;
if (!co.isEmpty(process.env.DATABASE_PORT)){
  mongoPort = process.env.DATABASE_PORT;
}

module.exports = {
    solrConfig: {
        HOST: host,
        PORT: port,
        CORE: core,
        PATH: path,
    },
    microservices: {
      userserviceURI: userserviceURI
    },
    mongoConfig:{
      HOST: mongoHost,
      PORT: mongoPort,
      SLIDEWIKIDATABASE: 'slidewiki'
    }
};
