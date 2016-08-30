'use strict'
const solr = require('solr-client'),
    config = require('../configuration').solrConfig;


module.exports = {

    // get results from SOLR
    get: function (params) {
        var promise = new Promise(function(resolve, reject) {
            var client = solr.createClient(config.HOST, config.PORT, config.CORE, config.PATH);

            // define query
            var query = client.createQuery().q(params.q);
            delete params.q;

            // define start
            var start = 0;
            if(params.hasOwnProperty('start') && params.start){
                start = params.start;
                delete params.start;
            }
            query.start(start);

            // define rows
            var rows = config.ROWS;
            if(params.hasOwnProperty('rows') && params.rows){
                rows = params.rows;
                delete params.rows;
            }
            query.rows(rows);

            // apply filters
            for (var prop in params) {

                // if filter's value is empty, ignore it
                if(!params[prop])
                    continue;

                // multi-value param handling
                if(params[prop] instanceof Array){
                    for(var filterValue in params[prop]){
                        query.matchFilter(prop, params[prop][filterValue]);
                    }
                }
                else{
                    query.matchFilter(prop, params[prop]);
                }
            }

            // console.log(query);

            // execute query
            client.search(query, function(err,obj){
                if(err){
                    reject(err);
                }
                resolve(obj);
            });
        });
        return promise;
    }
};
