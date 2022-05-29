const request = require('supertest');
const { expect } = require('chai');
const { doRequest, expectations, doQueryRequest } = require(process.cwd() +
  '/test/utils');

const testInsert = {
  name: 'Hive',
  apiary_id: 1,
  date: new Date().toISOString().slice(0, 10),
  source_id: 1,
  type_id: 1,
  start: 0,
  repeat: 10,
};

describe('Hive routes', function () {
  const route = '/api/v1/hive/';
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
            expect(res.body).to.be.a('Array');
            insertId = res.body[0];
            done();
          }
        );
      }
    );
  });

  describe('/api/v1/hive/', () => {
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

    it(`post 409 - duplicate name`, function (done) {
      doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        testInsert,
        function (err, res) {
          expect(res.statusCode).to.eqls(409);
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
        accessToken,
        {
          ids: [insertId],
          data: {},
        },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        }
      );
    });
  });

  describe('/api/v1/hive/:id', () => {
    it(`401 - no header`, function (done) {
      doQueryRequest(agent, route, insertId, null, null, function (err, res) {
        expect(res.statusCode).to.eqls(401);
        expect(res.errors, 'JsonWebTokenError');
        done();
      });
    });
    it(`200 - success`, function (done) {
      doQueryRequest(
        agent,
        route,
        insertId,
        accessToken,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.has.property('id');
          expect(res.body).to.has.property('name');
          expect(res.body).to.has.property('sameLocation');
          done();
        }
      );
    });
  });

  describe('/api/v1/hive/task/:id', () => {
    it(`401 - no header`, function (done) {
      doQueryRequest(
        agent,
        route + 'task/',
        insertId,
        null,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        }
      );
    });
    it(`200 - success`, function (done) {
      doQueryRequest(
        agent,
        route + 'task/',
        insertId,
        accessToken,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.has.property('harvest');
          expect(res.body).to.has.property('feed');
          expect(res.body).to.has.property('treatment');
          expect(res.body).to.has.property('checkup');
          expect(res.body).to.has.property('movedate');
          done();
        }
      );
    });
  });

  describe('/api/v1/hive/batchGet', () => {
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

  describe('/api/v1/hive/updatePosition', () => {
    it(`401 - no header`, function (done) {
      doRequest(
        agent,
        'patch',
        route + 'updatePosition',
        null,
        null,
        { data: [{ position: 0, id: insertId }] },
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
        route + 'updatePosition',
        null,
        null,
        null,
        function (err, res) {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'data', 'Invalid value');
          done();
        }
      );
    });
    it(`200 - success`, function (done) {
      doRequest(
        agent,
        'patch',
        route + 'updatePosition',
        null,
        accessToken,
        { data: [{ position: 0, id: insertId }] },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body[0]).to.equal(1);
          done();
        }
      );
    });
  });

  describe('/api/v1/hive/batchDelete', () => {
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
          expect(res.body).to.be.a('Array');
          done();
        }
      );
    });
  });

  describe('/api/v1/hive/status', () => {
    it(`401 - no header`, function (done) {
      doRequest(
        agent,
        'patch',
        route + 'status',
        null,
        null,
        { ids: [], status: true },
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
        route + 'status',
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
        route + 'status',
        null,
        accessToken,
        { ids: [insertId], status: false },
        function (err, res) {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        }
      );
    });
  });
});
