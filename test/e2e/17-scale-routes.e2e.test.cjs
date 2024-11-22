const { expect } = require('chai');
const { it, describe, before } = require('mocha');
const request = require('supertest');

const { doRequest, doQueryRequest } = require(`${process.cwd()
}/test/utils/index.cjs`);

const testInsert = {
  hive_id: 1,
  name: 'testScale',
};
const testInsert2 = {
  hive_id: 1,
  name: 'testScale2',
};

describe('scale routes', () => {
  const route = '/api/v1/scale';
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
            expect(res.body).to.be.a('Object');
            doRequest(
              agent,
              'post',
              route,
              null,
              accessToken,
              testInsert2,
              (_err, res) => {
                expect(res.statusCode).to.eqls(200);
                expect(res.body).to.be.a('Object');
                insertId = res.body.id;
                done();
              },
            );
          },
        );
      },
    );
  });

  describe('/api/v1/scale/', () => {
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
        { ids: [insertId], data: {} },
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
          expect(res.body).to.be.a('Array');
          done();
        },
      );
    });

    it(`post 400 - no data`, (done) => {
      doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(400);
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
          data: { name: 'updatedName' },
        },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        },
      );
    });
  });

  describe('/api/v1/scale/:id', () => {
    it(`get 401 - no header`, (done) => {
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
    it(`delete 401 - no header`, (done) => {
      doRequest(
        request.agent(global.server),
        'delete',
        route,
        insertId,
        null,
        testInsert,
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
        insertId,
        accessToken,
        null,
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.be.a('Array');
          done();
        },
      );
    });

    it(`delete 200 - success`, (done) => {
      doRequest(
        agent,
        'delete',
        route,
        insertId,
        accessToken,
        testInsert,
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        },
      );
    });
  });
});
