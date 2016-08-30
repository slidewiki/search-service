// example unit tests
'use strict';

//Mocking is missing completely TODO add mocked objects

describe('solr client', () => {
  let client = require('../solr/solrClient.js');
  let params = {
      q: '*:*',
      entity: 'slide',
      start: 0,
      rows: 10
  };
  let params_without_values = {
      q: '*:*',
      entity: '',
      start: 2,
      rows: ''
  };
  let params_with_multiple_keys = {
      q: '*:*',
      entity: 'slide',
      entity: 'deck'
  }

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

        client.get(params).then( (res) => {
            res.should.be.an('object').and.contain.keys('responseHeader','response');
            res.responseHeader.status.should.equal(0);
            res.responseHeader.params.should.be.an('object').and.contain.keys('q', 'fq', 'start', 'rows');
            for(var i in res.response.docs){
                res.response.docs[i].should.be.a('object').and.contain.keys('title', 'content', 'entity');
            }
            done();
        });
    });
    it('should ignore params without values', (done) => {

        client.get(params_without_values).then( (res) => {
            res.should.be.an('object').and.contain.keys('responseHeader','response');
            res.responseHeader.status.should.equal(0);
            res.responseHeader.params.should.be.an('object').and.not.contain.keys('fq');
            done();
        });
    });
  });
});
