'use strict';

const solrClient = require('./solrClient');
function escapeSpecialChars(s){
    return s.replace(/([\+\-!\(\)\{\}\[\]\^"~\*\?:\\])/g, (match) => {
        return '\\' + match;
    })
    .replace(/&&/g, '\\&\\&')
    .replace(/\|\|/g, '\\|\\|')
    .replace(/'/g, '');
}

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
        // bypass terms with zero score
        if(mergedResults[key] === 0)
            continue;

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
            // console.log(q);
            let queryString = 'defType=edismax' +
                    '&q=' + escapeSpecialChars(q) + '*' +
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

            let allKeywords = decodeURIComponent(q).replace(/ +/g, ' ').split(' ');     //trim multiple spaces and split
            let curKeyword = allKeywords[allKeywords.length - 1];

            let allExceptCurrent = [];
            let prefix = '';
            let paramQ = '*:*';
            if(allKeywords.length > 1){
                allExceptCurrent = allKeywords.slice(0, allKeywords.length-1);
                let fieldFilter = '(' + allExceptCurrent.join(' AND ') + ')';
                paramQ = 'title:' + fieldFilter +
                    ' OR description:' + fieldFilter +
                    ' OR content:' + fieldFilter;
                let index = q.lastIndexOf(' ');
                prefix = q.substring(0, index) + ' ';
            }

            let queryString =
                    'q=' + paramQ +
                    '&facet=true' +
                    '&facet.field=title&facet.field=description&facet.field=content' +
                    '&facet.prefix=' + curKeyword +
                    '&rows=0&wt=json&json.nl=map';

            // console.log(queryString);

            solrClient.facet(queryString).then( (res) => {
                let docs = mergeAndSortFacets(res, 10);
                docs = docs.map( (el) => {
                    return {
                        key: prefix + el.key,
                        value: el.value
                    };
                });

                resolve({
                    numFound: docs.length,
                    docs: docs
                });
            }).catch( (err) => {
                reject(err);
            });
        });
        return promise;
    },
};
