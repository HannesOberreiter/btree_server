const { expect } = require('chai');

const _doRequest = (agent, method, route, id, token, payload, callback) => {
  const path = id !== null ? `${route}${id}` : route;
  return agent[method](path)
    .set('Authorization', 'Bearer ' + token)
    .set('Accept', process.env.CONTENT_TYPE)
    .set('Content-Type', process.env.CONTENT_TYPE)
    .set('Origin', process.env.ORIGIN)
    .send(payload ? payload : {})
    .end(function (err, res) {
      callback(err, res);
    });
};

exports.doRequest = _doRequest;

const _doQueryRequest = (agent, route, id, token, payload, callback) => {
  const path = id !== null ? `${route}${id}` : route;
  return agent
    .get(path)
    .set('Authorization', 'Bearer ' + token)
    .set('Accept', process.env.CONTENT_TYPE)
    .set('Content-Type', process.env.CONTENT_TYPE)
    .set('Origin', process.env.ORIGIN)
    .query(payload)
    .end(function (err, res) {
      callback(err, res);
    });
};

exports.doQueryRequest = _doQueryRequest;

const _expectations = (res, field, err) => {
  expect(res.body.statusCode).to.eqls(400);
  expect(res.body.errors).to.be.an('array').length.gt(0);
  expect(res.body.errors).satisfy(function (value) {
    return value.filter((error) => error.param === field).length >= 1;
  });
};

exports.expectations = _expectations;
