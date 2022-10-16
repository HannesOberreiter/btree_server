const request = require('supertest');
const { expect } = require('chai');
const { doRequest, expectations, doQueryRequest } = require(process.cwd() +
  '/test/utils');

const newUser = 'newUser@demo.at';

describe('Company User routes', function () {
  const route = '/api/v1/company_user/';
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
      }
    );
  });

  describe('/api/v1/company_user/user', () => {
    it(`401 - no header`, function (done) {
      doQueryRequest(
        request.agent(global.server),
        route + 'user',
        null,
        null,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        }
      );
    });

    it(`add_user 401 - no header`, function (done) {
      doRequest(
        request.agent(global.server),
        'post',
        route + 'add_user',
        null,
        null,
        { email: newUser },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        }
      );
    });

    it(`200 - get`, function (done) {
      doQueryRequest(
        agent,
        route + 'user',
        null,
        accessToken,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.be.a('Array');
          done();
        }
      );
    });

    it(`add_user 200 - success`, function (done) {
      doRequest(
        agent,
        'post',
        route + 'add_user',
        null,
        accessToken,
        { email: newUser },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.email, newUser);
          expect(res.body).to.has.property('id');
          const newId = res.body.id;
          doRequest(
            agent,
            'delete',
            route + 'remove_user/',
            newId,
            accessToken,
            {},
            function (err, res) {
              expect(res.statusCode).to.eqls(200);
              expect(res.body).to.equal(1);
              done();
            }
          );
        }
      );
    });
  });

  describe('/api/v1/company_user/', () => {
    it(`delete 401 - no header`, function (done) {
      doRequest(
        request.agent(global.server),
        'delete',
        route + '1',
        null,
        null,
        {},
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        }
      );
    });

    it(`patch 401 - no header`, function (done) {
      doRequest(
        request.agent(global.server),
        'patch',
        route + '1',
        null,
        null,
        { rank: 1 },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        }
      );
    });

    it(`patch 400 - missing rank`, function (done) {
      doRequest(
        agent,
        'patch',
        route + '1',
        null,
        null,
        {},
        function (err, res) {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'rank', 'requiredField');
          done();
        }
      );
    });

    it(`patch 200 - success`, function (done) {
      doRequest(
        agent,
        'patch',
        route,
        1,
        accessToken,
        { rank: 1 },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        }
      );
    });
  });
});
