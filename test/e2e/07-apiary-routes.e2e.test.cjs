const { expect } = require('chai');
const { it, describe, before } = require('mocha');

const request = require('supertest');

const { doRequest, expectations, doQueryRequest } = require(`${process.cwd()
}/test/utils/index.cjs`);

const testInsert = {
  name: `TestApiary${new Date().toISOString()}`,
};

describe('apiary routes', () => {
  const route = '/api/v1/apiary';
  let accessToken, insertId;

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
        doRequest(
          agent,
          'post',
          route,
          null,
          accessToken,
          testInsert,
          (_err, res) => {
            expect(res.statusCode).to.eqls(200);
            expect(res.body).to.has.property('id');
            insertId = res.body.id;
            done();
          },
        );
      },
    );
  });

  describe('/api/v1/apiary/', () => {
    it(`get 401 - no header`, (done) => {
      doQueryRequest(
        request.agent(global.server),
        route,
        null,
        null,
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });
    it(`post 401 - no header`, (done) => {
      doRequest(
        request.agent(global.server),
        'post',
        route,
        null,
        null,
        testInsert,
        (_err, res) => {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
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
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });

    it(`get 200 - success`, (done) => {
      doQueryRequest(
        agent,
        route,
        null,
        accessToken,
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.results).to.be.a('Array');
          expect(res.body.total).to.be.a('number');
          done();
        },
      );
    });

    it(`post 400 - no name`, (done) => {
      doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'name', 'Invalid value');
          done();
        },
      );
    });

    it(`post 409 - duplicate name`, (done) => {
      doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        testInsert,
        (_err, res) => {
          expect(res.statusCode).to.eqls(409);
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
        {
          ids: [insertId],
          data: { name: 'test2' },
        },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        },
      );
    });
  });

  describe('/api/v1/apiary/:id', () => {
    it(`401 - no header`, (done) => {
      doQueryRequest(
        request.agent(global.server),
        route,
        insertId,
        null,
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });
    it(`200 - success`, (done) => {
      doQueryRequest(
        agent,
        route,
        insertId,
        accessToken,
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.has.property('id');
          expect(res.body).to.has.property('name');
          expect(res.body).to.has.property('sameLocation');
          done();
        },
      );
    });
  });

  describe('/api/v1/apiary/batchGet', () => {
    it(`401 - no header`, (done) => {
      doRequest(
        request.agent(global.server),
        'post',
        `${route}/batchGet`,
        null,
        null,
        { ids: [insertId] },
        (_err, res) => {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });
    it(`400 - missing ids`, (done) => {
      doRequest(
        agent,
        'post',
        `${route}/batchGet`,
        null,
        null,
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'ids', 'Invalid value');
          done();
        },
      );
    });
    it(`200 - success`, (done) => {
      doRequest(
        agent,
        'post',
        `${route}/batchGet`,
        null,
        accessToken,
        { ids: [insertId] },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.be.a('Array');
          done();
        },
      );
    });
  });

  describe('/api/v1/apiary/batchDelete', () => {
    it(`401 - no header`, (done) => {
      doRequest(
        request.agent(global.server),
        'patch',
        `${route}/batchDelete`,
        null,
        null,
        { ids: [] },
        (_err, res) => {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });
    it(`400 - missing ids`, (done) => {
      doRequest(
        agent,
        'patch',
        `${route}/batchDelete`,
        null,
        null,
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'ids', 'Invalid value');
          done();
        },
      );
    });
    it(`200 - success`, (done) => {
      doRequest(
        agent,
        'patch',
        `${route}/batchDelete`,
        null,
        accessToken,
        { ids: [insertId] },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.be.a('Array');
          done();
        },
      );
    });
  });

  describe('/api/v1/apiary/status', () => {
    it(`401 - no header`, (done) => {
      doRequest(
        request.agent(global.server),
        'patch',
        `${route}/status`,
        null,
        null,
        { ids: [], status: true },
        (_err, res) => {
          expect(res.statusCode).to.eqls(401);
          expect(res.errors, 'JsonWebTokenError');
          done();
        },
      );
    });
    it(`400 - missing ids`, (done) => {
      doRequest(
        agent,
        'patch',
        `${route}/status`,
        null,
        null,
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(400);
          expectations(res, 'ids', 'Invalid value');
          done();
        },
      );
    });
    it(`200 - success`, (done) => {
      doRequest(
        agent,
        'patch',
        `${route}/status`,
        null,
        accessToken,
        { ids: [insertId], status: false },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        },
      );
    });
  });
});
