const request = require('supertest');
const { expect } = require('chai');
const { doRequest, doQueryRequest } = require(
  process.cwd() + '/test/utils/index.cjs',
);

describe('Server Step routes', function () {
  const route = '/api/v1/server';
  let accessToken;

  before(function (done) {
    agent = request.agent(global.server);
    doRequest(
      agent,
      'post',
      '/api/v1/auth/login',
      null,
      null,
      global.demoUser,
      function (err, res) {
        if (err) throw err;
        expect(res.statusCode).to.eqls(200);
        expect(res.header, 'set-cookie', /connect.sid=.*; Path=\/; HttpOnly/);
        done();
      },
    );
  });

  describe('/api/v1/server/switch', () => {
    let apiKey;

    it(`200 - get api key`, function (done) {
      const route = '/api/v1/company/apikey';
      doQueryRequest(
        agent,
        route,
        null,
        accessToken,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.has.property('api_key');
          apiKey = res.body.api_key;
          done();
        },
      );
    });

    it(`post 401 - no header`, function (done) {
      doRequest(
        request.agent(global.server),
        'post',
        route + '/switch',
        null,
        null,
        { key: 'switch' },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });
    it(`post 400 - no data`, function (done) {
      doRequest(
        agent,
        'post',
        route + '/switch',
        null,
        accessToken,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(400);
          done();
        },
      );
    });
    it('post 401 - company not found', function (done) {
      doRequest(
        agent,
        'post',
        route + '/switch',
        null,
        accessToken,
        { key: apiKey },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          done();
        },
      );
    });
  });
});
