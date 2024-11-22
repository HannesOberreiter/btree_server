const { expect, it, describe } = require('mocha');
const request = require('supertest');

const { doRequest, doQueryRequest } = require(`${process.cwd()
}/test/utils/index.cjs`);

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

describe('fieldsetting routes', () => {
  const route = '/api/v1/field_setting';
  let accessToken;

  before((done) => {
    agent = request.agent(global.server);

    doRequest(
      agent,
      'post',
      '/api/v1/auth/login',
      null,
      null,
      global.demoUser,
      (err, res) => {
        if (err)
          throw err;
        expect(res.statusCode).to.eqls(200);
        expect(res.header, 'set-cookie', /connect.sid=.*; Path=\/; HttpOnly/);
        done();
      },
    );
  });

  describe('/api/v1/field_setting', () => {
    it(`401 - no header`, (done) => {
      doQueryRequest(
        request.agent(global.server),
        route,
        null,
        null,
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });

    it(`200 - patch and get`, (done) => {
      doRequest(
        agent,
        'patch',
        route,
        null,
        accessToken,
        { settings },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.deep.equal(JSON.parse(settings));
          doQueryRequest(
            agent,
            route,
            null,
            accessToken,
            null,
            (_err, res) => {
              expect(res.statusCode).to.eqls(200);
              expect(res.body).to.deep.equal({
                settings: JSON.parse(settings),
              });
              done();
            },
          );
        },
      );
    });
  });
});
