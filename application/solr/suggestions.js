'use strict';

const solrClient = require('./solrClient');


function mergeAndSortFacets(facetResults, limit){

    // merge facet results of all fields
    let mergedResults = {};
    for(let facetField in facetResults){
        for (let key in facetResults[facetField]){
            if(mergedResults.hasOwnProperty(key)){
                mergedResults[key] += facetResults[facetField][key];
            }
            else{
                mergedResults[key] = facetResults[facetField][key];
            }
        }
    }

    // sort based on frequency
    let sortedResults = [];
    for(let key in mergedResults){
        sortedResults.push({
            key: key,
            value: mergedResults[key]
        });
    }
    sortedResults.sort((x,y) => {return y.value - x.value;});

    return sortedResults.slice(0, limit);
}

module.exports = {

    // finds users
    findUsers: function(q){
        let promise = new Promise( (resolve, reject) => {
            let queryString = 'defType=edismax' +
                    '&q=' + q + '*' +
                    '&fq=kind:user' +
                    '&qf=username^10 surname forename email organization' +  //boost username match
                    '&fl=_id username' +
                    '&rows=10&wt=json';

            // console.log(queryString);

            solrClient.query(queryString).then( (res) => {
                resolve(res);
            }).catch( (err) => {
                reject(err);
            });
        });
        return promise;
    },

    // finds keywords
    findKeywords: function(q){
        let promise = new Promise( (resolve, reject) => {

            // facet.prefix=sp&wt=json&&facet.field=title&facet.field=content

            let queryString =
                    'q=' + q + '*' +
                    '&facet=true' +
                    '&facet.field=title&facet.field=description&facet.field=content&facet.field=speakernotes' +
                    '&facet.prefix=' + q +
                    '&rows=0&wt=json&json.nl=map';

            // console.log(queryString);

            solrClient.facet(queryString).then( (res) => {
                resolve(mergeAndSortFacets(res, 10));
            }).catch( (err) => {
                reject(err);
            });
        });
        return promise;
    },
};
