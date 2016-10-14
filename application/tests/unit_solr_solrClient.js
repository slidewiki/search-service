// example unit tests
'use strict';

//Mocking is missing completely TODO add mocked objects

describe('solr client', () => {
    let client = require('../solr/solrClient.js');
    let params = {
        q: '*:*',
        entity: 'slide',
        // start: 0,
        // rows: 10
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
            // client.get(params).then( (res) => {
            //   console.log('edw ' + JSON.stringify(params));

            // res.should.be.an('object').and.contain.keys('numFound','start', 'docs');
            done();
            // });
        });
    });
});
