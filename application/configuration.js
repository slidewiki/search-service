/* This module is used for confugrating the SOLR connection*/
'use strict';

const co = require('./common');

function check(config){
    for(let key in config){
        if(!config[key]){
            console.error('Config Error: ' + key + ' is not defined');
            process.exit(1);
        }
    }
}
// find solr config ENV variables
// default - give error - need to set test of production SOLR HOST
let solrConfig = {};
solrConfig.HOST = (!co.isEmpty(process.env.SOLR_HOST)) ? process.env.SOLR_HOST : '';
solrConfig.PORT = (!co.isEmpty(process.env.SOLR_CONFIG_PORT)) ? process.env.SOLR_CONFIG_PORT : '8983';
solrConfig.CORE = (!co.isEmpty(process.env.SOLR_CORE)) ? process.env.SOLR_CORE : 'swikcore';
solrConfig.PATH = (!co.isEmpty(process.env.SOLR_PATH)) ? process.env.SOLR_PATH : '/solr';
solrConfig.PROTOCOL = (!co.isEmpty(process.env.SOLR_PROTOCOL)) ? process.env.SOLR_PROTOCOL : 'http';
//local testing SOLR config:
// solrConfig.HOST = (!co.isEmpty(process.env.SOLR_HOST)) ? process.env.SOLR_HOST : 'slidewiki.imis.athena-innovation.gr';
//production SOLR config:
solrConfig.HOST = (!co.isEmpty(process.env.SOLR_HOST)) ? process.env.SOLR_HOST : 'solr';

console.log('#=========================== SOLR CONFIG ===========================#');
console.log(JSON.stringify(solrConfig, null, 4));
console.log();

check(solrConfig);

let slidewikiDbName = 'slidewiki';
if (process.env.NODE_ENV === 'test') {
    slidewikiDbName = 'slidewiki_test';
}

// find mongo config ENV variables
let mongoConfig = {};
mongoConfig.HOST = (!co.isEmpty(process.env.DATABASE_URL)) ? process.env.DATABASE_URL : 'localhost';
mongoConfig.PORT = (!co.isEmpty(process.env.DATABASE_PORT)) ? process.env.DATABASE_PORT : '27017';
mongoConfig.SLIDEWIKIDATABASE = slidewikiDbName;

console.log('#========================== MONGO CONFIG ===========================#');
console.log(JSON.stringify(mongoConfig, null, 4));
console.log();

check(mongoConfig);

let agendaJobsCollection = (!co.isEmpty(process.env.AGENDA_JOBS_COLLECTION)) ? process.env.AGENDA_JOBS_COLLECTION : 'agendaJobs';
let agendaJobsConcurrency = (!co.isEmpty(process.env.AGENDA_JOBS_CONCURRENCY)) ? process.env.AGENDA_JOBS_CONCURRENCY : 2;

let agendaConfig = {
    AGENDA_JOBS_COLLECTION: agendaJobsCollection, 
    AGENDA_JOBS_CONCURRENCY: agendaJobsConcurrency,
};

check(agendaConfig);

console.log('#=========================== AGENDA CONFIG ===========================#');
console.log(JSON.stringify(agendaConfig, null, 4));
console.log();

module.exports = { 
    solrConfig, 
    mongoConfig, 
    agendaConfig,
};
