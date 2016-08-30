// example unit tests
'use strict';

//Mocking is missing completely TODO add mocked objects

describe('Helper', () => {
  let helper = require('../solr/helper.js');

  // get modules
  beforeEach((done) => {
    require('chai').should();
    let chai = require('chai');
    let chaiAsPromised = require('chai-as-promised');
    chai.use(chaiAsPromised);
    done();
  });

  context('when parsing a query string', () => {
    it('it should return the correct parameters in json format', () => {
        let querystring = 'q=introduction&entity=slide&language=en';
        let res = helper.parse(querystring);

        return Promise.all([
            res.should.be.fulfilled,
            res.should.eventually.not.be.empty,
            res.should.eventually.have.property('q').that.is.not.empty,
            res.should.eventually.have.property('entity').that.is.not.empty,
            res.should.eventually.have.property('language').that.is.not.empty,
            res.should.eventually.have.deep.property('q', 'introduction'),
            res.should.eventually.have.deep.property('entity', 'slide'),
            res.should.eventually.have.deep.property('language', 'en'),
        ]);
    });

    it('it should return multi-value parameters', () => {
        let querystring = 'q=introduction&entity=slide&language=en&tag=rdf&tag=open';
        let res = helper.parse(querystring);

        return Promise.all([
            res.should.be.fulfilled,
            res.should.eventually.not.be.empty,
            res.should.eventually.have.property('q').that.is.not.empty,
            res.should.eventually.have.property('entity').that.is.not.empty,
            res.should.eventually.have.property('language').that.is.not.empty,
            res.should.eventually.have.property('tag').that.is.not.empty,
            res.should.eventually.have.property('tag').that.contains.all('rdf', 'open'),
            res.should.eventually.have.deep.property('q', 'introduction'),
            res.should.eventually.have.deep.property('entity', 'slide'),
            res.should.eventually.have.deep.property('language', 'en'),
            // res.should.eventually.have.deep.property('tag', 'rdf'),
        ]);

    });
  });
});
