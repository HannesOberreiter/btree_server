const { expect } = require('chai');
const { it, describe, before } = require('mocha');
const request = require('supertest');

const { doRequest, expectations, doQueryRequest } = require(`${process.cwd()
}/test/utils/index.cjs`);

const inactiveUser = {
  email: `inactive${Date.now()}@btree.at`,
  password: 'test_btree',
  name: 'Test Beekeeper',
  lang: 'en',
  newsletter: false,
  source: '0',
};

describe('authentification routes', () => {
  let agent, confirmToken;

  before((done) => {
    agent = request.agent(global.server);
    doRequest(
      agent,
      'post',
      '/api/v1/auth/register',
      null,
      null,
      global.demoUser,
      (_err, res) => {
        expect(res.statusCode).to.eqls(200);
        expect(res.body.email, global.demoUser.email);
        expect(res.body.activate).to.be.a('string');
        confirmToken = res.body.activate;
        doRequest(
          agent,
          'post',
          '/api/v1/auth/register',
          null,
          null,
          inactiveUser,
          (_err, res) => {
            expect(res.statusCode).to.eqls(200);
            expect(res.body.email, global.demoUser.email);
            expect(res.body.activate).to.be.a('string');
            done();
          },
        );
      },
    );
  });

  describe('/api/v1/auth/register', () => {
    const route = '/api/v1/auth/register';

    it('400 - empty payload', (done) => {
      doRequest(agent, 'post', route, null, null, {}, (_err, res) => {
        expect(res.statusCode).to.eqls(400);
        done();
      });
    });

    it('400 - wrong confirm', (done) => {
      doRequest(
        agent,
        'patch',
        '/api/v1/auth/confirm',
        null,
        null,
        { confirm: 'test' },
        (_err, res) => {
          expectations(res, 'confirm', 'Invalid value');
          done();
        },
      );
    });

    it('200 - confirm email', (done) => {
      doRequest(
        agent,
        'patch',
        '/api/v1/auth/confirm',
        null,
        null,
        { confirm: confirmToken },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.email, global.demoUser.email);
          done();
        },
      );
    });
  });

  describe('/api/v1/auth/login', () => {
    const route = '/api/v1/auth/login';

    it('400 - empty payload', (done) => {
      doRequest(agent, 'post', route, null, null, {}, (_err, res) => {
        expect(res.statusCode).to.eqls(400);
        done();
      });
    });

    it('400 - inactive user', (done) => {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        { email: inactiveUser.email, password: inactiveUser.password },
        (_err, res) => {
          expect(res.statusCode).to.eqls(401);
          done();
        },
      );
    });

    it('400 - too short password', (done) => {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        { email: 'test@test.at', password: 'tes' },
        (_err, res) => {
          expectations(res, 'password', 'Invalid value');
          done();
        },
      );
    });

    it('403 - wrong password', (done) => {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        { email: global.demoUser.email, password: 'testseet22' },
        (_err, res) => {
          // Too many login attempts happen in watch testing
          expect(res.statusCode).to.eqls(403);
          done();
        },
      );
    });

    it('403 - wrong email', (done) => {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        { email: 'demo_@btree.at', password: 'testseet22' },
        (_err, res) => {
          expect(res.statusCode).to.eqls(403);
          done();
        },
      );
    });

    it('200 - login', (done) => {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        global.demoUser,
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.data).to.be.a('Object');
          expect(res.header, 'set-cookie', /connect.sid=.*; Path=\/; HttpOnly/);
          done();
        },
      );
    });
  });

  describe('/api/v1/auth/unsubscribe', () => {
    const route = '/api/v1/auth/unsubscribe';
    it('200 - success', (done) => {
      doRequest(
        agent,
        'patch',
        route,
        null,
        null,
        { email: global.demoUser.email },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.email, global.demoUser.email);
          done();
        },
      );
    });
  });

  describe('/api/v1/auth/reset', () => {
    const route = '/api/v1/auth/reset';
    const newPassword = 'newPassword';

    it('200 - success', (done) => {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        { email: inactiveUser.email },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.email, inactiveUser.email);
          expect(res.body.token).to.be.a('string');
          doRequest(
            agent,
            'patch',
            route,
            null,
            null,
            { key: res.body.token, password: newPassword },
            (_err, res) => {
              expect(res.statusCode).to.eqls(200);
              expect(res.body.email, inactiveUser.email);
              doRequest(
                agent,
                'post',
                '/api/v1/auth/login',
                null,
                null,
                { email: res.body.email, password: newPassword },
                (_err, res) => {
                  expect(res.statusCode).to.eqls(200);
                  expect(res.body.data).to.be.a('Object');
                  done();
                },
              );
            },
          );
        },
      );
    });
  });

  describe('/api/v1/auth/discourse', () => {
    const route = '/api/v1/auth/discourse';
    const sso
      = 'payload=bm9uY2U9OTJkYWQ0NTMxZTBhZDIwMmY4MWMxYWM0NzVmYjQ5MDMmcmV0dXJuX3Nzb191cmw9aHR0cHMlM0ElMkYlMkZmb3J1bS5idHJlZS5hdCUyRnNlc3Npb24lMkZzc29fbG9naW4%3D&sig=e18fcf73285bdf65610b43ca2e80712175e660571d1d934c08d9499679a52ad0';

    it('400 - bad request', (done) => {
      doQueryRequest(agent, route, null, null, null, (_err, res) => {
        expect(res.statusCode).to.eqls(400);
        done();
      });
    });

    it('401 - unauthorized', (done) => {
      doQueryRequest(
        request.agent(global.server),
        `${route}?${sso}`,
        null,
        null,
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(401);
          done();
        },
      );
    });

    it('200 - discourse payload', (done) => {
      doRequest(
        agent,
        'post',
        '/api/v1/auth/login',
        null,
        null,
        global.demoUser,
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.data).to.be.a('Object');
          expect(res.header, 'set-cookie', /connect.sid=.*; Path=\/; HttpOnly/);
          doQueryRequest(
            agent,
            `${route}?${sso}`,
            null,
            null,
            null,
            (_err, res) => {
              expect(res.statusCode).to.eqls(200);
              expect(res.body).to.be.a('Object');
              expect(res.body.q).to.include('sso');
              done();
            },
          );
        },
      );
    });
  });

  describe('/api/v1/user/', () => {
    const route = '/api/v1/user/';
    it('200 - checkpassword', (done) => {
      doRequest(
        agent,
        'post',
        '/api/v1/auth/login',
        null,
        null,
        global.demoUser,
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.data).to.be.a('Object');
          expect(res.header, 'set-cookie', /connect.sid=.*; Path=\/; HttpOnly/);
          doRequest(
            agent,
            'post',
            `${route}checkpassword`,
            null,
            null,
            global.demoUser,
            (_err, res) => {
              expect(res.statusCode).to.eqls(200);
              expect(res.body).to.be.equal(true);
              done();
            },
          );
        },
      );
    });
  });
});
