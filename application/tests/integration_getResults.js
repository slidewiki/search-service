/* eslint dot-notation: 0, no-unused-vars: 0 */
'use strict';

//Mocking is missing completely TODO add mocked objects

describe('REST API', () => {

    let server;

    beforeEach((done) => {
        //Clean everything up before doing new tests
        Object.keys(require.cache).forEach((key) => delete require.cache[key]);
        require('chai').should();
        let hapi = require('hapi');
        server = new hapi.Server();
        server.connection({
            host: 'localhost',
            port: 3050
        });
        require('../routes.js')(server);
        done();
    });

    let options = {
        method: 'GET',
        url: '/search?keywords=*:*&kind=slide&start=0',
        // payload: slide,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    context('fetching results from SOLR', () => {
        it('should reply', (done) => {
            server.inject(options, (response) => {
                response.should.be.an('object').and.contain.keys('statusCode','payload');
                response.statusCode.should.equal(200);
                response.payload.should.be.a('string');
                let payload = JSON.parse(response.payload);
                payload.should.be.an('object').and.contain.keys('responseHeader', 'response', 'expanded');
                // payload.responseHeader.params.should.be.an('object').and.contain.keys('q', 'fq', 'start', 'rows');
                // for(let i in payload.response.docs){
                //   payload.response.docs[i].should.be.a('object').and.contain.keys('title', 'content', 'entity');
                // }
                done();
            });
        });
    });
});
