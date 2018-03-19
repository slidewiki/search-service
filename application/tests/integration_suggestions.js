// /* eslint dot-notation: 0, no-unused-vars: 0 */
// 'use strict';

// //Mocking is missing completely TODO add mocked objects

// describe('REST API', () => {

//     let server;

//     beforeEach((done) => {
//         //Clean everything up before doing new tests
//         Object.keys(require.cache).forEach((key) => delete require.cache[key]);
//         require('chai').should();
//         let hapi = require('hapi');
//         server = new hapi.Server();
//         server.connection({
//             host: 'localhost',
//             port: 3050
//         });
//         require('../routes.js')(server);
//         done();
//     });
//     //
//     // let slide = {
//     //   title: 'Dummy',
//     //   body: 'dummy',
//     //   language: 'en'
//     // };
//     let options = {
//         method: 'GET',
//         url: '/suggest/users?q=*',
//         // payload: slide,
//         headers: {
//             'Content-Type': 'application/json'
//         }
//     };

//     let options2 = {
//         method: 'GET',
//         url: '/suggest/keywords?q=*',
//         // payload: slide,
//         headers: {
//             'Content-Type': 'application/json'
//         }
//     };

//     context('fetching username suggestions from SOLR', () => {
//         it('should reply', (done) => {
//             server.inject(options, (response) => {
//                 response.should.be.an('object').and.contain.keys('statusCode','payload');
//                 response.statusCode.should.equal(200);
//                 response.payload.should.be.a('string');
//                 let payload = JSON.parse(response.payload);
//                 for(let i in payload){
//                     payload[i].should.be.a('object').and.contain.keys('db_id', 'username', 'highlight');
//                 }
//                 done();
//             });
//         });
//     });

//     context('fetching keyword suggestions from SOLR', () => {
//         it('should reply', (done) => {
//             server.inject(options2, (response) => {
//                 response.should.be.an('object').and.contain.keys('statusCode','payload');
//                 response.statusCode.should.equal(200);
//                 response.payload.should.be.a('string');
//                 let payload = JSON.parse(response.payload);
//                 payload.should.be.an('object').and.contain.keys('response');
//                 // payload.responseHeader.params.should.be.an('object').and.contain.keys('q', 'fq', 'start', 'rows');
//                 // for(let i in payload.response.docs){
//                 //   payload.response.docs[i].should.be.a('object').and.contain.keys('title', 'content', 'entity');
//                 // }
//                 done();
//             });
//         });
//     });
// });
