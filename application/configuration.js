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
//local testing SOLR config:
//solrConfig.HOST = (!co.isEmpty(process.env.SOLR_HOST)) ? process.env.SOLR_HOST : 'http://slidewiki.imis.athena-innovation.gr';
//production SOLR config:
solrConfig.HOST = (!co.isEmpty(process.env.SOLR_HOST)) ? process.env.SOLR_HOST : 'http://solr';

console.log('#=========================== SOLR CONFIG ===========================#');
console.log(JSON.stringify(solrConfig, null, 4));
console.log();

check(solrConfig);

// find mongo config ENV variables
let mongoConfig = {};
mongoConfig.HOST = (!co.isEmpty(process.env.DATABASE_URL)) ? process.env.DATABASE_URL : 'localhost';
mongoConfig.PORT = (!co.isEmpty(process.env.DATABASE_PORT)) ? process.env.DATABASE_PORT : '27017';
mongoConfig.SLIDEWIKIDATABASE = 'slidewiki';

console.log('#========================== MONGO CONFIG ===========================#');
console.log(JSON.stringify(mongoConfig, null, 4));
console.log();

check(mongoConfig);

module.exports = { solrConfig, mongoConfig };
