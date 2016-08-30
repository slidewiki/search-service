'use strict';

const solrClient = require('solr-client');

module.exports = {

    // parses query string into json params
    parse: function(qstr){
        var promise = new Promise(function(resolve, reject) {
            var query = {};

            if(qstr){
                var a = qstr.trim().split('&');
                for (var i = 0; i < a.length; i++) {
                    var b = a[i].split('=');

                    // handle multiple key values
                    if(query.hasOwnProperty(decodeURIComponent(b[0]))){
                        var arr = [];
                        arr.push(query[decodeURIComponent(b[0])]);
                        arr.push(decodeURIComponent(b[1] || ''));
                        query[decodeURIComponent(b[0])] = arr;
                    }
                    else{
                        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
                    }
                }
                resolve(query);
            }

        });
        return promise;
    },
};
