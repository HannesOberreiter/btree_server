const request = require('supertest');
const { expect } = require('chai');
const { doRequest, expectations, doQueryRequest } = require(process.cwd() +
  '/test/utils');

const patchCompanyName = 'newName';
const newCompanyName = 'testCompany';

describe('Company routes', function () {
  const route = '/api/v1/company';
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

  describe('/api/v1/company/apikey', () => {
    it(`401 - no header`, function (done) {
      doQueryRequest(
        request.agent(global.server),
        route + '/apikey',
        null,
        null,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });

    it(`200 - get`, function (done) {
      doQueryRequest(
        agent,
        route + '/apikey',
        null,
        accessToken,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.has.property('api_key');
          done();
        },
      );
    });
  });

  describe('/api/v1/company/', () => {
    it(`patch 400 - name too short`, function (done) {
      doRequest(
        agent,
        'patch',
        route,
        null,
        null,
        { name: 'a' },
        function (err, res) {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'name', 'Invalid value');
          done();
        },
      );
    });

    it(`patch 401 - no header`, function (done) {
      doRequest(
        request.agent(global.server),
        'patch',
        route,
        null,
        null,
        { name: 'newName' },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });

    it(`patch 200 - success`, function (done) {
      doRequest(
        agent,
        'patch',
        route,
        null,
        accessToken,
        { name: patchCompanyName },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.name, patchCompanyName);
          done();
        },
      );
    });

    it(`post 200 - success`, function (done) {
      doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        { name: newCompanyName + new Date().toISOString() },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.has.property('name');
          expect(res.body).to.has.property('id');
          const newCompanyId = res.body.id;
          const responseName = res.body.name;
          doRequest(
            agent,
            'post',
            route,
            null,
            accessToken,
            { name: responseName },
            function (err, res) {
              expect(res.statusCode).to.eqls(409);
              doRequest(
                agent,
                'delete',
                route,
                newCompanyId,
                accessToken,
                {},
                function (err, res) {
                  expect(res.statusCode).to.eqls(200);
                  expect(res.body.result, 1);
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
});
