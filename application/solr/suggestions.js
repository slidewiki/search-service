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

module.exports = {

    // finds users
    findUsers: function(q){
        let promise = new Promise( (resolve, reject) => {

            let queryString = 'q=' + escapeSpecialChars(encodeURIComponent(q)) + '*';

            resolve(solrClient.query(queryString, 'swSuggestUsers'));
        });
        return promise;
    },

    // finds keywords
    findKeywords: function(q){
        let promise = new Promise( (resolve, reject) => {

            let allKeywords = decodeURIComponent(q).replace(/ +/g, ' ').split(' ').map( (keyword) => {
                return escapeSpecialChars(keyword);
            });     //trim multiple spaces, split and escape

            let curKeyword = allKeywords[allKeywords.length - 1];

            let allExceptCurrent = [];
            let paramQ = '*:*';
            if(allKeywords.length > 1){
                allExceptCurrent = allKeywords.slice(0, allKeywords.length-1);
                let fieldFilter = '(' + allExceptCurrent.join(' AND ') + ')';
                paramQ = 'title:' + fieldFilter +
                    ' OR description:' + fieldFilter +
                    ' OR content:' + fieldFilter +
                    ' OR speakernotes:' + fieldFilter;
            }

            let queryString =
                    'q=' + encodeURIComponent(paramQ) +
                    '&facet=true' +
                    '&facet.prefix=' + encodeURIComponent(curKeyword);

            resolve(solrClient.query(queryString, 'swSuggestKeywords'));
        });
        return promise;
    },
};
