'use strict';

const solrClient = require('./lib/solrClient');
const { escapeSpecialChars } = require('./lib/util');
const querystring = require('querystring');

function getUserHighlight(user, userHighlight){
    let highlightText = (userHighlight.username) ? userHighlight.username[0] : user.username;
    
    let forename = (userHighlight.forename) ? userHighlight.forename[0] : user.forename;
    if(forename) highlightText += `, ${forename}`;  

    let surname = (userHighlight.surname) ? userHighlight.surname[0] : user.surname;
    if(surname) highlightText += ` ${surname}`;

    return highlightText;
}


module.exports = {

    // finds users
    findUsers: function(q){
        let query = {
            q: `${escapeSpecialChars(q)}*`, 
            hl: true,
        };
       
        return solrClient.query('swSuggestUsers', query).then( (solrResponse) => {
            let highlight = solrResponse.highlighting;
 
            return solrResponse.response.docs.map( (user) => {
                return {
                    db_id: user.db_id, 
                    username: user.username,
                    highlight: getUserHighlight(user, highlight[user.solr_id])
                };
            });
        });
    },

    // finds keywords
    findKeywords: function(q){

        let allKeywords = decodeURIComponent(q).replace(/ +/g, ' ').split(' ').map( (keyword) => {
            return escapeSpecialChars(keyword).toLowerCase();
        });     //trim multiple spaces, split and escape

        // filter empty elements
        // allKeywords = allKeywords.filter( (el) => { return el !== undefined; });

        let curKeyword = allKeywords[allKeywords.length - 1];

        let allExceptCurrent = [];
        let paramQ = '*:*';
        let prefix = '';
        if(allKeywords.length > 1){
            allExceptCurrent = allKeywords.slice(0, allKeywords.length-1);
            let fieldFilter = '(' + allExceptCurrent.join(' AND ') + ')';
            paramQ = 'title:' + fieldFilter +
                ' OR description:' + fieldFilter +
                ' OR content:' + fieldFilter +
                ' OR speakernotes:' + fieldFilter;
            let index = q.lastIndexOf(' ');
            prefix = q.substring(0, index) + ' ';
        }

        let query = {
            q: paramQ, 
            active: true, 
            facet: true, 
            'facet.prefix': curKeyword
        };

        return solrClient.query('swSuggestKeywords', query).then( (res) => {
            res = res.facet_counts.facet_fields.autocomplete;
            let docs = [];

            // TODO set json.nl=arrmap, mincount=1 and facet.limit in solrconfig to avoid the code below
            let limit = 5;
            for(let i=0; i<res.length; i = i+2){
                if(allExceptCurrent.indexOf(res[i]) > -1)
                    continue;

                // limit returned number of docs
                if(docs.length === limit)
                    break;

                // if it has frequency greater than zero
                if(res[i+1] > 0){
                    docs.push({
                        key: prefix + res[i],
                        value: res[i+1]
                    });
                }

            }

            return {
                response: {
                    numFound: docs.length,
                    docs: docs
                }
            };
        });
    }
};
