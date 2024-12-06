const { expect } = require('chai');
const { it, describe, before } = require('mocha');
const request = require('supertest');

const { doRequest, expectations, doQueryRequest } = require(`${process.cwd()
}/test/utils/index.cjs`);

const testInsert = {
  scale_id: 1,
  datetime: new Date().toISOString().replace('Z', '').replace('T', ' '),
  weight: 1,
  temp1: 2,
  temp2: 2.5,
  note: '----',
};

describe('scale Data routes', () => {
  const route = '/api/v1/scale_data';
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
            insertId = res.body.id;
            done();
          },
        );
      },
    );
  });

  describe('/api/v1/scale_data/', () => {
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
          expect(res.body.results).to.be.a('Array');
          expect(res.body.total).to.be.a('number');
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
          data: { weight: 2 },
        },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        },
      );
    });
  });

  describe('/api/v1/scale_data/batchGet', () => {
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

  describe('/api/v1/scale_data/batchDelete', () => {
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
          expect(res.body).to.equal(1);
          done();
        },
      );
    });
  });
});
