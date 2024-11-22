const { expect } = require('chai');
const request = require('supertest');

const { doRequest, expectations, doQueryRequest } = require(`${process.cwd()
}/test/utils/index.cjs`);

const testInsert = {
  name: 'test',
};

const options = [
  'charge_types',
  'hive_sources',
  'hive_types',
  'feed_types',
  'harvest_types',
  'checkup_types',
  'queen_matings',
  'queen_races',
  'treatment_diseases',
  'treatment_types',
  'treatment_vets',
];

options.map((option) => {
  describe(`${option} routes`, () => {
    const route = `/api/v1/option/${option}`;
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
            (err, res) => {
              expect(res.statusCode).to.eqls(200);
              expect(res.body).to.be.a('Object');
              insertId = res.body.id;
              done();
            },
          );
        },
      );
    });

    describe(`/api/v1/option/${option}`, () => {
      it(`get 401 - no header`, (done) => {
        doQueryRequest(
          request.agent(global.server),
          route,
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
      it(`post 401 - no header`, (done) => {
        doRequest(
          request.agent(global.server),
          'post',
          route,
          null,
          null,
          testInsert,
          (err, res) => {
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
          (err, res) => {
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
          (err, res) => {
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
          (err, res) => {
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
          (err, res) => {
            expect(res.statusCode).to.eqls(200);
            expect(res.body).to.equal(1);
            done();
          },
        );
      });
    });

    describe(`/api/v1/option/${option}/batchGet`, () => {
      it(`401 - no header`, (done) => {
        doRequest(
          request.agent(global.server),
          'post',
          `${route}/batchGet`,
          null,
          null,
          { ids: [insertId] },
          (err, res) => {
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
          (err, res) => {
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
          (err, res) => {
            expect(res.statusCode).to.eqls(200);
            expect(res.body).to.be.a('Array');
            done();
          },
        );
      });
    });

    describe(`/api/v1/option/${option}/status`, () => {
      it(`401 - no header`, (done) => {
        doRequest(
          request.agent(global.server),
          'patch',
          `${route}/status`,
          null,
          null,
          { ids: [], status: true },
          (err, res) => {
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
          (err, res) => {
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
          (err, res) => {
            expect(res.statusCode).to.eqls(200);
            expect(res.body).to.equal(1);
            done();
          },
        );
      });
    });

    describe(`/api/v1/option/${option}/favorite`, () => {
      it(`401 - no header`, (done) => {
        doRequest(
          request.agent(global.server),
          'patch',
          `${route}/favorite`,
          null,
          null,
          { ids: [] },
          (err, res) => {
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
          `${route}/favorite`,
          null,
          null,
          null,
          (err, res) => {
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
          `${route}/favorite`,
          null,
          accessToken,
          { ids: [insertId] },
          (err, res) => {
            expect(res.statusCode).to.eqls(200);
            expect(res.body).to.equal(1);
            done();
          },
        );
      });
    });

    describe(`/api/v1/option/${option}/batchDelete`, () => {
      it(`401 - no header`, (done) => {
        doRequest(
          request.agent(global.server),
          'patch',
          `${route}/batchDelete`,
          null,
          null,
          { ids: [] },
          (err, res) => {
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
          (err, res) => {
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
          (err, res) => {
            expect(res.statusCode).to.eqls(200);
            expect(res.body).to.equal(1);
            done();
          },
        );
      });
    });
  });
});
