'use strict';

const solr = require('solr-client'),
  config = require('../configuration').solrConfig;


module.exports = {

  // get results from SOLR
  get: function (params) {
    let promise = new Promise( (resolve, reject) => {
      let client = solr.createClient(config.HOST, config.PORT, config.CORE, config.PATH);

      // define query
      let query = client.createQuery();

      let q = params.q;
      if(params.hasOwnProperty('fields') && params.fields){
        if(params.q !== '*:*'){
          q = params.fields + ':*' + params.q + '*';
        }

        delete params.fields;
      }
      query.q(q);

      delete params.q;

      // define start
      let start = 0;
      if(params.hasOwnProperty('start') && params.start){
        start = params.start;
        delete params.start;
      }
      query.start(start);

      // define rows
      let rows = 10;
      if(params.hasOwnProperty('rows') && params.rows){
        rows = params.rows;
        delete params.rows;
      }
      query.rows(rows);

      // apply filters
      for (let prop in params) {

        // if filter's value is empty, ignore it
        if(!params[prop])
          continue;

        // multi-value param handling
        if(params[prop] instanceof Array){
          for(let filterValue in params[prop]){
            query.matchFilter(prop, params[prop][filterValue]);
          }
        }
        else{
          query.matchFilter(prop, params[prop]);
        }
      }

      // console.log(query);

      // execute query
      client.search(query, (err,obj) => {
        if(err){
          reject(err);
        }
        resolve(obj);
      });
    });
    return promise;
  }
};
