const request = require('supertest');
const { expect } = require('chai');
const { doRequest, expectations, doQueryRequest } = require(
  process.cwd() + '/test/utils/index.cjs',
);

const testInsert = {
  hive_ids: [2, 3],
  apiary_id: 1,
  date: new Date().toISOString().slice(0, 10),
};

describe('Movedate routes', function () {
  const route = '/api/v1/movedate';
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
            expect(res.body).to.be.a('Array');
            insertId = res.body[0];
            done();
          },
        );
      },
    );
  });

  describe('/api/v1/movedate/', () => {
    it(`get 401 - no header`, function (done) {
      doQueryRequest(
        request.agent(global.server),
        route,
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
    it(`patch 401 - no header`, function (done) {
      doRequest(
        request.agent(global.server),
        'patch',
        route,
        null,
        null,
        { ids: [insertId], data: {} },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });

    it(`get 200 - success`, function (done) {
      doQueryRequest(
        agent,
        route,
        null,
        accessToken,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.results).to.be.a('Array');
          expect(res.body.total).to.be.a('number');
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

    it(`patch 200 - success`, function (done) {
      doRequest(
        agent,
        'patch',
        route,
        null,
        accessToken,
        {
          ids: [insertId],
          data: {},
        },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        },
      );
    });
  });

  describe('/api/v1/movedate/batchGet', () => {
    it(`401 - no header`, function (done) {
      doRequest(
        request.agent(global.server),
        'post',
        route + '/batchGet',
        null,
        null,
        { ids: [insertId] },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });
    it(`400 - missing ids`, function (done) {
      doRequest(
        agent,
        'post',
        route + '/batchGet',
        null,
        null,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'ids', 'Invalid value');
          done();
        },
      );
    });
    it(`200 - success`, function (done) {
      doRequest(
        agent,
        'post',
        route + '/batchGet',
        null,
        accessToken,
        { ids: [insertId] },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.be.a('Array');
          done();
        },
      );
    });
  });

  describe('/api/v1/movedate/date', () => {
    it(`401 - no header`, function (done) {
      doRequest(
        request.agent(global.server),
        'patch',
        route + '/date',
        null,
        null,
        { ids: [], start: testInsert.date },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });
    it(`400 - missing ids`, function (done) {
      doRequest(
        agent,
        'patch',
        route + '/date',
        null,
        null,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'ids', 'Invalid value');
          done();
        },
      );
    });
    it(`200 - success`, function (done) {
      doRequest(
        agent,
        'patch',
        route + '/date',
        null,
        accessToken,
        { ids: [insertId], start: testInsert.date },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        },
      );
    });
  });

  describe('/api/v1/movedate/batchDelete', () => {
    it(`401 - no header`, function (done) {
      doRequest(
        request.agent(global.server),
        'patch',
        route + '/batchDelete',
        null,
        null,
        { ids: [] },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });
    it(`400 - missing ids`, function (done) {
      doRequest(
        agent,
        'patch',
        route + '/batchDelete',
        null,
        null,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'ids', 'Invalid value');
          done();
        },
      );
    });
    it(`200 - success`, function (done) {
      doRequest(
        agent,
        'patch',
        route + '/batchDelete',
        null,
        accessToken,
        { ids: [insertId] },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        },
      );
    });
  });
});
