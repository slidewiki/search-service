'use strict';

module.exports = {

  // parses query string into json params
  parse: function(qstr){
    let promise = new Promise( (resolve, reject) => {
      let query = {};

      if(qstr){
        let a = qstr.trim().split('&');
        for (let i = 0; i < a.length; i++) {
          let b = a[i].split('=');

          // handle multiple key values
          if(query.hasOwnProperty(decodeURIComponent(b[0]))){
            let arr = [];
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
