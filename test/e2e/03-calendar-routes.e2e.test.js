const request = require('supertest');
const { expect } = require('chai');
const { doRequest, expectations, doQueryRequest } = require(process.cwd() +
  '/test/utils');

describe('Calendar routes', function () {
  const route = '/api/v1/calendar';
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
        expect(res.statusCode).to.eqls(200);
        expect(res.body.token).to.be.a('Object');
        accessToken = res.body.token.accessToken;
        done();
      }
    );
  });

  describe('/api/v1/calendar/<task>', () => {
    const kinds = [
      '/feed',
      '/treatment',
      '/harvest',
      '/checkup',
      '/rearing',
      '/movedate',
      '/scale_data',
    ];
    kinds.map((kind) => {
      it(`${kind} 400 - empty payload`, function (done) {
        doQueryRequest(
          agent,
          route + kind,
          null,
          null,
          {},
          function (err, res) {
            expect(res.statusCode).to.eqls(400);
            expectations(res, 'start', 'Invalid value');
            expectations(res, 'end', 'Invalid value');
            done();
          }
        );
      });

      it(`${kind} 401 - no header`, function (done) {
        doQueryRequest(
          agent,
          route + kind,
          null,
          null,
          { start: new Date().toISOString(), end: new Date().toISOString() },
          function (err, res) {
            expect(res.statusCode).to.eqls(401);
            expect(res.errors, 'JsonWebTokenError');
            done();
          }
        );
      });

      it(`${kind} 200 - success`, function (done) {
        doQueryRequest(
          agent,
          route + kind,
          null,
          accessToken,
          {
            start: new Date('2020-01-01').toISOString(),
            end: new Date('2020-12-30').toISOString(),
          },
          function (err, res) {
            expect(res.statusCode).to.eqls(200);
            expect(res.body).to.be.a('Array');
            done();
          }
        );
      });
    });
  });
});
