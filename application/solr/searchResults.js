'use strict';

const solrClient = require('./solrClient'),
    helper = require('./helper');


module.exports = {

    get: function (params) {
        let promise = new Promise( (resolve, reject) => {

            let solr_params = helper.getSolrParameters(params);

            let queryString = '';

            let rootQ = '';
            // query only child docs
            if(params.hasOwnProperty('fields')){
                rootQ = (solr_params.rootQ !== '') ? solr_params.rootQ + ' AND ' : '';
            }
            // query both parent and child docs
            else{
                rootQ = '(' + solr_params.childQ +' AND (kind:slide OR kind:deck)) OR ';
            }

            let childQAndFQ = solr_params.childQ;
            childQAndFQ += (solr_params.childFQ !== '') ? (' AND ' + solr_params.childFQ) : '';

            queryString =
                'q=' + rootQ + '{!join from=solr_parent_id to=solr_id score=max v=\'' + childQAndFQ + '\'}' +
                '&fq=' + solr_params.rootFQ +
                '&fl=*,revisions:[subquery]' +
                '&sort=score desc, lastUpdate desc' +
                '&revisions.q=' + solr_params.childQ + ' AND {!terms f=solr_parent_id v=$row.solr_id}' +
                '&revisions.fq=' + solr_params.childFQ +
                '&revisions.sort=score desc, timestamp desc' +
                '&rows=50&wt=json';

            // let requestUri = 'http://' + solrUri + queryString;
            solrClient.query(queryString).then( (resp) => {
                this.checkResponse(resp).then( (res) => {

                    for(let i in res){
                        resp.docs[res[i].item].revisions = res[i];
                    }
                    resolve(resp);
                }).catch( (error) => {
                    reject('in checkResponse. solrResponse: ' + solrResponse);
                });
            }).catch( (err) => {
                reject(err);
            });
        });
        return promise;
    },
    checkResponse: function(response){
        let promises = [];

        for (let i in response.docs){
            let curDoc = response.docs[i];

            // if results has no children
            if(curDoc.revisions.numFound === 0){

                // fetch active child
                let query = 'q=solr_parent_id:' + curDoc.solr_id + ' AND active:true';
                promises.push(solrClient.query(query, i));
            }
        }
        return Promise.all(promises);
    },
};
