/* This module is used for confugrating the SOLR connection*/
'use strict';


const solrHost = 'slidewiki.imis.athena-innovation.gr';
const solrPort = 8983;
const solrCore = 'swcore';
const solrPath = '/solr';
const rows = 10;

module.exports = {
    solrConfig: {
        HOST: solrHost,
        PORT: solrPort,
        CORE: solrCore,
        PATH: solrPath,
        ROWS: rows
    }
};
