const { expect } = require('chai');
const request = require('supertest');

const { doRequest, expectations, doQueryRequest } = require(
  `${process.cwd()}/test/utils/index.cjs`,
);

const patchCompanyName = 'newName';
const newCompanyName = 'testCompany';

describe('company routes', () => {
  const route = '/api/v1/company';
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

  describe('/api/v1/company/apikey', () => {
    it(`401 - no header`, (done) => {
      doQueryRequest(
        request.agent(global.server),
        `${route}/apikey`,
        null,
        null,
        null,
        (err, res) => {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });

    it(`200 - get`, (done) => {
      doQueryRequest(
        agent,
        `${route}/apikey`,
        null,
        accessToken,
        null,
        (err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.has.property('api_key');
          done();
        },
      );
    });
  });

  describe('/api/v1/company/', () => {
    it(`patch 400 - name too short`, (done) => {
      doRequest(
        agent,
        'patch',
        route,
        null,
        null,
        { name: 'a' },
        (err, res) => {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'name', 'Invalid value');
          done();
        },
      );
    });

    it(`patch 401 - no header`, (done) => {
      doRequest(
        request.agent(global.server),
        'patch',
        route,
        null,
        null,
        { name: 'newName' },
        (err, res) => {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });

    it(`patch 200 - success`, (done) => {
      doRequest(
        agent,
        'patch',
        route,
        null,
        accessToken,
        { name: patchCompanyName, api_change: true },
        (err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.name, patchCompanyName);
          done();
        },
      );
    });

    it(`post 200 - success`, (done) => {
      doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        { name: newCompanyName + new Date().toISOString() },
        (err, res) => {
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
            (err, res) => {
              expect(res.statusCode).to.eqls(409);
              doRequest(
                agent,
                'delete',
                route,
                newCompanyId,
                accessToken,
                {},
                (err, res) => {
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
