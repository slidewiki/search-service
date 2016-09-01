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
if (!co.isEmpty(process.env.SOLR_PORT)){
  port = process.env.SOLR_PORT;
  // console.log('Using port ' + port + ' as solr port.');
}

let core = 'swcore';
if (!co.isEmpty(process.env.SOLR_CORE)){
  core = process.env.SOLR_CORE;
  // console.log('Using core ' + core + ' as solr core.');
}

let path = '/solr';
if (!co.isEmpty(process.env.SOLR_PATH)){
  path = process.env.SOLR_PATH;
  // console.log('Using path ' + path + ' as solr path.');
}

const solrPath =
module.exports = {
    solrConfig: {
        HOST: host,
        PORT: port,
        CORE: core,
        PATH: path,
    }
};
