const { expect, it, describe } = require('mocha');
const request = require('supertest');

const {
  doRequest,
  expectations,
  doQueryRequest,
} = require(`${process.cwd()}/test/utils/index.cjs`);

describe('calendar routes', () => {
  const route = '/api/v1/calendar';

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
    kinds.forEach((kind) => {
      it(`${kind} 400 - empty payload`, (done) => {
        doQueryRequest(
          agent,
          route + kind,
          null,
          null,
          {},
          (_err, res) => {
            expect(res.statusCode).to.eqls(400);
            if (kind !== '/rearing') {
              expectations(res, 'start', 'Invalid value');
              expectations(res, 'end', 'Invalid value');
            }
            done();
          },
        );
      });

      it(`${kind} 401 - no header`, (done) => {
        doQueryRequest(
          request.agent(global.server),
          route + kind,
          null,
          null,
          { start: new Date().toISOString(), end: new Date().toISOString() },
          (_err, res) => {
            expect(res.statusCode).to.eqls(401);
            expect(res.errors, 'JsonWebTokenError');
            done();
          },
        );
      });

      it(`${kind} 200 - success`, (done) => {
        doQueryRequest(
          agent,
          route + kind,
          null,
          null,
          {
            start: new Date('2020-01-01').toISOString(),
            end: new Date('2020-12-30').toISOString(),
          },
          (_err, res) => {
            expect(res.statusCode).to.eqls(200);
            expect(res.body).to.be.a('Array');
            done();
          },
        );
      });
    });
  });
});
