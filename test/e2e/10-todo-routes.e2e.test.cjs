const { expect } = require('chai');
const { it, describe, before } = require('mocha');
const request = require('supertest');

const { doRequest, expectations, doQueryRequest } = require(`${process.cwd()
}/test/utils/index.cjs`);

const testInsert = {
  date: new Date().toISOString().slice(0, 10),
  name: 'testTodo',
  note: '----',
  done: false,
  url: '',
  repeat: 10,
};

describe('todo routes', () => {
  const route = '/api/v1/todo';
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
            expect(res.body).to.be.a('Array');
            insertId = res.body[0];
            done();
          },
        );
      },
    );
  });

  describe('/api/v1/todo/', () => {
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
          data: {},
        },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        },
      );
    });
  });

  describe('/api/v1/todo/batchGet', () => {
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

  describe('/api/v1/todo/status', () => {
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

  describe('/api/v1/todo/date', () => {
    it(`401 - no header`, (done) => {
      doRequest(
        request.agent(global.server),
        'patch',
        `${route}/date`,
        null,
        null,
        { ids: [], start: testInsert.date },
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
        `${route}/date`,
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
        `${route}/date`,
        null,
        accessToken,
        { ids: [String(insertId)], start: testInsert.date },
        (_err, res) => {
          console.log(res.body);
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.equal(1);
          done();
        },
      );
    });
  });

  describe('/api/v1/todo/batchDelete', () => {
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

  describe('/api/v1/todo with apiary_id', () => {
    let todoWithApiaryId;

    it(`post 200 - create todo with apiary_id`, (done) => {
      const testInsertWithApiary = {
        ...testInsert,
        name: 'testTodoWithApiary',
        apiary_id: 1,
      };
      doRequest(
        agent,
        'post',
        route,
        null,
        accessToken,
        testInsertWithApiary,
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.be.a('Array');
          todoWithApiaryId = res.body[0];
          done();
        },
      );
    });

    it(`get 200 - filter by apiary_id`, (done) => {
      doQueryRequest(
        agent,
        route,
        null,
        accessToken,
        { apiary_id: 1 },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body.results).to.be.a('Array');
          done();
        },
      );
    });

    it(`batchGet 200 - return apiary data`, (done) => {
      doRequest(
        agent,
        'post',
        `${route}/batchGet`,
        null,
        accessToken,
        { ids: [todoWithApiaryId] },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          expect(res.body).to.be.a('Array');
          if (res.body.length > 0 && res.body[0].apiary_id) {
            expect(res.body[0]).to.have.property('apiary');
          }
          done();
        },
      );
    });

    it(`batchDelete 200 - cleanup`, (done) => {
      doRequest(
        agent,
        'patch',
        `${route}/batchDelete`,
        null,
        accessToken,
        { ids: [todoWithApiaryId] },
        (_err, res) => {
          expect(res.statusCode).to.eqls(200);
          done();
        },
      );
    });
  });
});
