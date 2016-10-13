'use strict';

function escapeSpecialChars(s){
  return s.replace(/([\+\-!\(\)\{\}\[\]\^"~\*\?:\\])/g, function(match) {
    return '\\' + match;
  })
  .replace(/&&/g, '\\&\\&')
  .replace(/\|\|/g, '\\|\\|')
  .replace(/'/g, '');
}

module.exports = {
  getSolrParameters: function(params){
    let solr_params = {};
    let childQ = [];
    let childFilters = [];
    let rootQ = [];
    let rootFilters = [];

    if(params.q){
      params.q = encodeURIComponent(escapeSpecialChars(params.q));
      if(params.fields){
        if(params.fields === 'description'){
          rootQ.push('description:('+ params.q +')');
        }
        else{
          childQ.push(params.fields + ':(' + params.q + ')');
        }
      }
      else{
        childQ.push('('+ params.q +')');
      }
    }

    if(params.language){
      rootFilters.push('language:*' + params.language + '*');
    }

    if(params.tags){
      params.tags = encodeURIComponent(escapeSpecialChars(params.tags));
      childFilters.push('tags:' + params.tags);
    }

    if(params.revisions === 'false'){
      childFilters.push('active:true');
    }

    if(params.entity){
      rootFilters.push('kind:' + params.entity);
    }

    if(params.user){
      params.user = encodeURIComponent(escapeSpecialChars(params.user));
      rootFilters.push('user:' + params.user);
    }

    if(params.license){
      rootFilters.push('license:\"' + params.license +'\"');
    }

    solr_params.rootQ = (rootQ.length > 0) ? rootQ.join(' AND ') : '';
    solr_params.rootFQ = (rootFilters.length > 0) ? rootFilters.join(' AND ') : '';
    solr_params.childQ = (childQ.length > 0 ) ? childQ.join(' AND ') : '*:*';
    solr_params.childFQ = (childFilters.length > 0) ? childFilters.join(' AND ') : '';

    return solr_params;
  }
};
