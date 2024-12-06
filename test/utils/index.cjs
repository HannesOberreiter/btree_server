const process = require('node:process');
const { expect } = require('chai');

function _doRequest(agent, method, route, id, _token, payload, callback) {
  const path = id !== null ? `${route}/${id}` : route;
  return (
    agent[method](path)
      // .set('Authorization', 'Bearer ' + token)
      .set('Accept', process.env.CONTENT_TYPE)
      .set('Content-Type', process.env.CONTENT_TYPE)
      .set('Origin', process.env.ORIGIN)
      .withCredentials()
      .send(payload || {})
      .end((err, res) => {
        callback(err, res);
      })
  );
}

exports.doRequest = _doRequest;

exports.login = function (request, done) {
  _doRequest(
    request.agent(global.server),
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
};

function _doQueryRequest(agent, route, id, token, payload, callback) {
  const path = id !== null ? `${route}/${id}` : route;
  return (
    agent
      .get(path)
      // .set('Authorization', 'Bearer ' + token)
      // .attachCookies(token)
      .withCredentials()
      .set('Accept', process.env.CONTENT_TYPE)
      .set('Content-Type', process.env.CONTENT_TYPE)
      .set('Origin', process.env.ORIGIN)
      .query(payload)
      .end((err, res) => {
        callback(err, res);
      })
  );
}

exports.doQueryRequest = _doQueryRequest;

function _expectations(res, field, _err) {
  expect(res.body.statusCode).to.eqls(400);
  if (res.body.issue) {
    expect(res.body.issues).to.be.an('array').length.gt(0);
    expect(res.body.issues).satisfy((value) => {
      return value.filter(error => error.path.includes(field)).length >= 1;
    });
  }
  if (res.body.cause) {
    expect(res.body.cause.type).to.be.equal('ModelValidation');
  }
}

exports.expectations = _expectations;
