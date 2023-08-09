const request = require('supertest');
const { expect } = require('chai');
const { doRequest, expectations, doQueryRequest } = require(process.cwd() +
  '/test/utils');

const testInsert = {
  type_id: 1,
  detail_id: 1,
  position: 1,
};

describe('Rearing Step routes', function () {
  const route = '/api/v1/rearing_step';
  let accessToken, insertId;

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
        doRequest(
          agent,
          'post',
          route,
          null,
          accessToken,
          testInsert,
          function (err, res) {
            expect(res.statusCode).to.eqls(200);
            expect(res.body).to.be.a('Object');
            insertId = res.body.id;
            done();
          },
        );
      },
    );
  });

  describe('/api/v1/rearing_step/', () => {
    it(`post 401 - no header`, function (done) {
      doRequest(
        request.agent(global.server),
        'post',
        route,
        null,
        null,
        testInsert,
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
        route,
        null,
        accessToken,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(400);
          done();
        },
      );
    });
  });

  describe('/api/v1/rearing_step/updatePosition', () => {
    it(`401 - no header`, function (done) {
      doRequest(
        request.agent(global.server),
        'patch',
        route + '/updatePosition',
        null,
        null,
        { data: [] },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });
    it(`400 - missing value`, function (done) {
      doRequest(
        agent,
        'patch',
        route + '/updatePosition',
        null,
        null,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'data', 'Invalid value');
          done();
        },
      );
    });
    it(`200 - success`, function (done) {
      doRequest(
        agent,
        'patch',
        route + '/updatePosition',
        null,
        accessToken,
        { data: [{ id: insertId, position: 10, sleep_before: 0 }] },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.be.a('Array');
          done();
        },
      );
    });
  });

  describe('/api/v1/rearing_step/:id', () => {
    it(`401 - no header`, function (done) {
      doRequest(
        request.agent(global.server),
        'delete',
        route,
        insertId,
        null,
        { ids: [] },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });

    it(`200 - success`, function (done) {
      doRequest(
        agent,
        'delete',
        route,
        insertId,
        accessToken,
        {},
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        },
      );
    });
  });
});
