// example unit tests
'use strict';

//Mocking is missing completely TODO add mocked objects

describe('solr client', () => {
    let searchResults = require('../solr/searchResults.js');
    let params = {
        keywords: '*:*',
        kind: 'slide',
        start: 0,
        rows: 10
    };

    // get modules
    beforeEach((done) => {
        require('chai').should();
        let chai = require('chai');
        let chaiAsPromised = require('chai-as-promised');
        chai.use(chaiAsPromised);
        done();
    });

    context('querying SOLR', () => {
        it('should reply with the results', (done) => {
            searchResults.get(params).then( (res) => {
                res.should.be.an('object').and.contain.keys('responseHeader','response', 'expanded');
                done();
            }).catch( (err) => {
                // console.log(err);
                done(err);
            });
        });
    });
});
