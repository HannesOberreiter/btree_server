const { expect } = require('chai');
const { it, describe } = require('mocha');
const request = require('supertest');

describe('routes resolving', () => {
  describe('/status', () => {
    it('200 - OK', (done) => {
      request(global.server)
        .get('/api/v1/status')
        .set('Content-Type', process.env.CONTENT_TYPE)
        .set('Origin', process.env.ORIGIN)
        .expect(200, done);
    });
  });

  describe('/report-violation', () => {
    it('200 - OK', (done) => {
      request(global.server)
        .post('/api/v1/report-violation')
        .set('Content-Type', process.env.CONTENT_TYPE)
        .set('Origin', process.env.ORIGIN)
        .send({ data: 'report-violation' })
        .expect(200, done);
    });
  });

  describe('/*', () => {
    it('404 - anything', (done) => {
      request(global.server)
        .get('/api/v1/foo/bar')
        .set('Content-Type', process.env.CONTENT_TYPE)
        .set('Accept', process.env.CONTENT_TYPE)
        .set('Origin', process.env.ORIGIN)
        .expect(404, done);
    });

    it('406 - domain not allowed by CORS', (done) => {
      request(global.server)
        .get('/api/v1/status')
        .set('Accept', process.env.CONTENT_TYPE)
        .set('Content-Type', process.env.CONTENT_TYPE)
        .set('Origin', 'http://www.test.com')
        .expect(406, done);
    });

    it('200 - options request', (done) => {
      request(global.server)
        .options('/api/v1/status')
        .set('Origin', process.env.ORIGIN)
        .end((_err, res) => {
          expect(res.headers['access-control-allow-origin']).to.equal(
            process.env.ORIGIN,
          );
          done();
        });
    });
  });
});
