const request = require('supertest');
const { expect } = require('chai');
const { doRequest, expectations } = require(process.cwd() + '/test/utils');

const registerUser = {
  email: `test${Date.now()}@btree.at`,
  password: 'test_btree',
  name: 'Test Beekeeper',
  lang: 'en',
  newsletter: false,
  source: '0',
};

const inactiveUser = {
  email: `inactive${Date.now()}@btree.at`,
  password: 'test_btree',
  name: 'Test Beekeeper',
  lang: 'en',
  newsletter: false,
  source: '0',
};

describe('Authentification routes', function () {
  let agent, confirmToken;

  before(function (done) {
    agent = request.agent(global.server);
    doRequest(
      agent,
      'post',
      '/api/v1/auth/register',
      null,
      null,
      registerUser,
      function (err, res) {
        expect(res.statusCode).to.eqls(200);
        expect(res.body.email, registerUser.email);
        expect(res.body.activate).to.be.a('string');
        confirmToken = res.body.activate;
        doRequest(
          agent,
          'post',
          '/api/v1/auth/register',
          null,
          null,
          inactiveUser,
          function (err, res) {
            expect(res.statusCode).to.eqls(200);
            expect(res.body.email, registerUser.email);
            expect(res.body.activate).to.be.a('string');
            done();
          }
        );
      }
    );
  });

  describe('/api/v1/auth/register', () => {
    const route = '/api/v1/auth/register';

    it('400 - empty payload', function (done) {
      doRequest(agent, 'post', route, null, null, {}, function (err, res) {
        expect(res.statusCode).to.eqls(400);
        done();
      });
    });

    it('400 - wrong confirm', function (done) {
      doRequest(
        agent,
        'patch',
        '/api/v1/auth/confirm',
        null,
        null,
        { confirm: 'test' },
        function (err, res) {
          expectations(res, 'confirm', 'Invalid value');
          done();
        }
      );
    });

    it('200 - confirm email', function (done) {
      doRequest(
        agent,
        'patch',
        '/api/v1/auth/confirm',
        null,
        null,
        { confirm: confirmToken },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.email, registerUser.email);
          done();
        }
      );
    });
  });

  describe('/api/v1/auth/login', () => {
    const route = '/api/v1/auth/login';

    it('400 - empty payload', function (done) {
      doRequest(agent, 'post', route, null, null, {}, function (err, res) {
        expect(res.statusCode).to.eqls(400);
        done();
      });
    });

    it('400 - inactive user', function (done) {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        { email: inactiveUser.email, password: inactiveUser.password },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          done();
        }
      );
    });

    it('400 - too short password', function (done) {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        { email: 'test@test.at', password: 'tes' },
        function (err, res) {
          expectations(res, 'password', 'Invalid value');
          done();
        }
      );
    });

    it('401 - wrong password', function (done) {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        { email: registerUser.email, password: 'testseet22' },
        function (err, res) {
          // Too many login attempts happen in watch testing
          expect(res.statusCode).to.eqls(401);
          done();
        }
      );
    });

    it('401 - wrong email', function (done) {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        { email: 'demo_@btree.at', password: 'testseet22' },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          done();
        }
      );
    });

    it('200 - login and refresh token', function (done) {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        global.demoUser,
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.token).to.be.a('Object');
          expect(res.body.data).to.be.a('Object');
          doRequest(
            agent,
            'post',
            '/api/v1/auth/refresh',
            null,
            res.body.token.accessToken,
            res.body.token.refreshToken,
            function (err, res) {
              expect(res.statusCode).to.eqls(200);
              expect(res.body.result).to.be.a('Object');
              done();
            }
          );
        }
      );
    });
  });

  describe('/api/v1/auth/unsubscribe', () => {
    const route = '/api/v1/auth/unsubscribe';
    it('200 - success', function (done) {
      doRequest(
        agent,
        'patch',
        route,
        null,
        null,
        { email: registerUser.email },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.email, registerUser.email);
          done();
        }
      );
    });
  });

  describe('/api/v1/auth/reset', () => {
    const route = '/api/v1/auth/reset';
    const newPassword = 'newPassword';
    it('200 - success', function (done) {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        { email: registerUser.email },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.email, registerUser.email);
          expect(res.body.token).to.be.a('string');
          doRequest(
            agent,
            'patch',
            route,
            null,
            null,
            { key: res.body.token, password: newPassword },
            function (err, res) {
              expect(res.statusCode).to.eqls(200);
              expect(res.body.email, registerUser.email);
              doRequest(
                agent,
                'post',
                '/api/v1/auth/login',
                null,
                null,
                { email: res.body.email, password: newPassword },
                function (err, res) {
                  expect(res.statusCode).to.eqls(200);
                  expect(res.body.token).to.be.a('Object');
                  expect(res.body.data).to.be.a('Object');
                  done();
                }
              );
            }
          );
        }
      );
    });
  });
});
