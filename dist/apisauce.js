'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.responseToProblem = exports.create = exports.UNKNOWN_ERROR = exports.NETWORK_ERROR = exports.CONNECTION_ERROR = exports.TIMEOUT_ERROR = exports.SERVER_ERROR = exports.CLIENT_ERROR = exports.NONE = undefined;

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _ramdasauce = require('ramdasauce');

var _ramdasauce2 = _interopRequireDefault(_ramdasauce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// check for an invalid config
var isInvalidConfig = _ramda2.default.anyPass([_ramda2.default.isNil, _ramda2.default.isEmpty, _ramda2.default.complement(_ramda2.default.has('baseURL')), _ramda2.default.complement(_ramda2.default.propIs(String, 'baseURL')), _ramda2.default.propSatisfies(_ramda2.default.isEmpty, 'baseURL')]);

// the default configuration for axios
var DEFAULT_CONFIG = {
  timeout: 0,
  headers: {}
};

var NONE = null;
var CLIENT_ERROR = 'CLIENT_ERROR';
var SERVER_ERROR = 'SERVER_ERROR';
var TIMEOUT_ERROR = 'TIMEOUT_ERROR';
var CONNECTION_ERROR = 'CONNECTION_ERROR';
var NETWORK_ERROR = 'NETWORK_ERROR';
var UNKNOWN_ERROR = 'UNKNOWN_ERROR';

var VERBS = _ramda2.default.split(',', 'get,post,patch,delete,put,head');
var NODEJS_CONNECTION_ERROR_CODES = ['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET'];
var in200s = _ramdasauce2.default.isWithin(200, 299);
var in400s = _ramdasauce2.default.isWithin(400, 499);
var in500s = _ramdasauce2.default.isWithin(500, 599);

/**
  Creates a instance of our API using the configuration.
 */
var create = function create(config) {
  // quick sanity check
  if (isInvalidConfig(config)) throw new Error('config must have a baseURL');

  // combine the user's defaults with ours
  var combinedConfig = _ramda2.default.merge(DEFAULT_CONFIG, config);

  // create the axios instance
  var instance = _axios2.default.create(combinedConfig);

  // make the functions for requesting each verb
  return _ramda2.default.pipe(_ramda2.default.map(function (v) {
    return [v, _ramda2.default.partial(doRequest, [instance, v])];
  }), _ramda2.default.append(['axios', instance]), _ramda2.default.fromPairs)(VERBS);
};

/**
  Make the request.
 */
var doRequest = function doRequest(instance, verb, url, params, data) {
  var requestConfig = {
    url: url,
    params: params,
    method: verb,
    data: data
  };
  // console.log(requestConfig)
  return instance.request(requestConfig).then(function (response) {
    var problem = responseToProblem(response);
    var status = response.status;
    var headers = response.headers;
    var config = response.config;
    var data = response.data;

    return { ok: true, status: status, headers: headers, config: config, data: data, problem: problem };
  }).catch(function (response) {
    var problem = responseToProblem(response);
    if (response instanceof Error) {
      return { ok: false, status: null, headers: null, config: null, data: null, problem: problem };
    } else {
      var status = response.status;
      var headers = response.headers;
      var config = response.config;
      var _data = response.data;

      return { ok: false, status: status, headers: headers, config: config, data: _data, problem: problem };
    }
  });
};

/**
  What's the problem for this response?

  TODO: We're losing some error granularity, but i'm cool with that
  until someone cares.
 */
var responseToProblem = function responseToProblem(response) {
  if (response instanceof Error) {
    var known = _ramda2.default.contains(response.code, NODEJS_CONNECTION_ERROR_CODES);
    return known ? CONNECTION_ERROR : UNKNOWN_ERROR;
  }
  if (_ramda2.default.isNil(response) || !_ramda2.default.has('status')) return UNKNOWN_ERROR;
  return _ramda2.default.cond([[in200s, _ramda2.default.always(NONE)], [in400s, _ramda2.default.always(CLIENT_ERROR)], [in500s, _ramda2.default.always(SERVER_ERROR)], [_ramda2.default.T, _ramda2.default.always(UNKNOWN_ERROR)]])(response.status || 0);
};

module.exports = {
  responseToProblem: responseToProblem,
  create: create,
  NONE: NONE,
  CLIENT_ERROR: CLIENT_ERROR,
  SERVER_ERROR: SERVER_ERROR,
  TIMEOUT_ERROR: TIMEOUT_ERROR,
  CONNECTION_ERROR: CONNECTION_ERROR,
  NETWORK_ERROR: NETWORK_ERROR,
  UNKNOWN_ERROR: UNKNOWN_ERROR
};

exports.NONE = NONE;
exports.CLIENT_ERROR = CLIENT_ERROR;
exports.SERVER_ERROR = SERVER_ERROR;
exports.TIMEOUT_ERROR = TIMEOUT_ERROR;
exports.CONNECTION_ERROR = CONNECTION_ERROR;
exports.NETWORK_ERROR = NETWORK_ERROR;
exports.UNKNOWN_ERROR = UNKNOWN_ERROR;
exports.create = create;
exports.responseToProblem = responseToProblem;