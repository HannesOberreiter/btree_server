const request = require('supertest');
const { expect } = require('chai');
const { doRequest, expectations, doQueryRequest } = require(process.cwd() +
  '/test/utils');

const testInsert = {
  name: 'TestType',
  note: '',
};

describe('Rearing Type routes', function () {
  const route = '/api/v1/rearing_type/';
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
        expect(res.statusCode).to.eqls(200);
        expect(res.body.token).to.be.a('Object');
        accessToken = res.body.token.accessToken;
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
          }
        );
      }
    );
  });

  describe('/api/v1/rearing_type/', () => {
    it(`get 401 - no header`, function (done) {
      doQueryRequest(agent, route, null, null, null, function (err, res) {
        expect(res.statusCode).to.eqls(401);
        expect(res.errors, 'JsonWebTokenError');
        done();
      });
    });
    it(`post 401 - no header`, function (done) {
      doRequest(
        agent,
        'post',
        route,
        null,
        null,
        testInsert,
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        }
      );
    });
    it(`patch 401 - no header`, function (done) {
      doRequest(
        agent,
        'patch',
        route,
        null,
        null,
        { ids: [insertId] },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        }
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
        }
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
        }
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
          data: { name: 'newTypeName' },
        },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        }
      );
    });
  });

  describe('/api/v1/rearing_type/batchGet', () => {
    it(`401 - no header`, function (done) {
      doRequest(
        agent,
        'post',
        route + 'batchGet',
        null,
        null,
        { ids: [insertId] },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        }
      );
    });
    it(`400 - missing ids`, function (done) {
      doRequest(
        agent,
        'post',
        route + 'batchGet',
        null,
        null,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'ids', 'Invalid value');
          done();
        }
      );
    });
    it(`200 - success`, function (done) {
      doRequest(
        agent,
        'post',
        route + 'batchGet',
        null,
        accessToken,
        { ids: [insertId] },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.be.a('Array');
          done();
        }
      );
    });
  });

  describe('/api/v1/rearing_type/batchDelete', () => {
    it(`401 - no header`, function (done) {
      doRequest(
        agent,
        'patch',
        route + 'batchDelete',
        null,
        null,
        { ids: [] },
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        }
      );
    });
    it(`400 - missing ids`, function (done) {
      doRequest(
        agent,
        'patch',
        route + 'batchDelete',
        null,
        null,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'ids', 'Invalid value');
          done();
        }
      );
    });
    it(`200 - success`, function (done) {
      doRequest(
        agent,
        'patch',
        route + 'batchDelete',
        null,
        accessToken,
        { ids: [insertId] },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        }
      );
    });
  });
});
