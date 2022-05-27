const request = require('supertest');
const { expect } = require('chai');
const { doRequest, expectations, doQueryRequest } = require(process.cwd() +
  '/test/utils');

const settings = JSON.stringify({
  checkup: {
    rating: false,
    queen: false,
    strength: false,
    weight: false,
    temperature: false,
    varroa: false,
    frames: false,
  },
  harvest: { water: false, frames: false },
  treatment: { wait: false, vet: false },
  charge: { price: false, bestbefore: false },
});

describe('Fieldsetting routes', function () {
  const route = '/api/v1/field_setting/';
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

  describe('/api/v1/field_setting/', () => {
    it(`401 - no header`, function (done) {
      doQueryRequest(agent, route, null, null, null, function (err, res) {
        expect(res.statusCode).to.eqls(401);
        expect(res.errors, 'JsonWebTokenError');
        done();
      });
    });

    it(`200 - patch`, function (done) {
      doRequest(
        agent,
        'patch',
        route,
        null,
        accessToken,
        { settings: settings },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.deep.equal(JSON.parse(settings));
          done();
        }
      );
    });

    it(`200 - get`, function (done) {
      doQueryRequest(
        agent,
        route,
        null,
        accessToken,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.deep.equal({ settings: JSON.parse(settings) });
          done();
        }
      );
    });
  });
});
