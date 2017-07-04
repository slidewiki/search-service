'use strict';

module.exports = {
	escapeSpecialChars: function(s){
	    return s.replace(/([\+\-!\(\)\{\}\[\]\^"~\*\?:\\])/g, (match) => {
	        return '\\' + match;
	    })
	    .replace(/&&/g, '\\&\\&')
	    .replace(/\|\|/g, '\\|\\|')
	    .replace(/'/g, '');
	}, 

	stripHTML: function(htmlString){
        return htmlToText.fromString(htmlString, {
            // ignoreImage: true,
            // ignoreHref: true,
            uppercaseHeadings: false
        });
    }
};