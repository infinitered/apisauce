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

var TIMEOUT_ERROR_CODES = ['ECONNABORTED'];
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
  var monitors = [];
  var addMonitor = function addMonitor(monitor) {
    monitors.push(monitor);
  };

  // create the base object
  var sauce = {
    axiosInstance: instance,
    monitors: monitors,
    addMonitor: addMonitor
  };

  // attach functions for each our HTTP verbs
  sauce.get = _ramda2.default.partial(doRequestWithoutBody, [sauce, 'get']);
  sauce.delete = _ramda2.default.partial(doRequestWithoutBody, [sauce, 'delete']);
  sauce.head = _ramda2.default.partial(doRequestWithoutBody, [sauce, 'head']);
  sauce.post = _ramda2.default.partial(doRequestWithBody, [sauce, 'post']);
  sauce.put = _ramda2.default.partial(doRequestWithBody, [sauce, 'put']);
  sauce.patch = _ramda2.default.partial(doRequestWithBody, [sauce, 'patch']);

  // send it back
  return sauce;
};

/**
  Make the request for GET, HEAD, DELETE
 */
var doRequestWithoutBody = function doRequestWithoutBody(api, method, url) {
  var params = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];
  var axiosConfig = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

  return doRequest(api, _ramda2.default.merge({ url: url, params: params, method: method }, axiosConfig));
};

/**
  Make the request for POST, PUT, PATCH
 */
var doRequestWithBody = function doRequestWithBody(api, method, url) {
  var data = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];
  var axiosConfig = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

  return doRequest(api, _ramda2.default.merge({ url: url, method: method, data: data }, axiosConfig));
};

/**
  Make the request with this config!
 */
var doRequest = function doRequest(api, axiosRequestConfig) {
  var axiosInstance = api.axiosInstance;

  // first convert the axios response, then execute our callback

  var chain = _ramda2.default.pipe(convertResponse, _ramda2.default.partial(runMonitors, [api]));

  // Make the request and execute the identical pipeline for both promise paths.
  return axiosInstance.request(axiosRequestConfig).then(chain).catch(chain);
};

/**
  Fires after we convert from axios' response into our response.  Exceptions
  raised for each monitor will be ignored.
 */
var runMonitors = function runMonitors(api, ourResponse) {
  api.monitors.forEach(function (fn) {
    try {
      fn(ourResponse);
    } catch (error) {
      // all monitor complaints will be ignored
    }
  });
  return ourResponse;
};

/**
  Converts an axios response/error into our response.
 */
var convertResponse = function convertResponse(axiosResponse) {
  return {
    problem: responseToProblem(axiosResponse),
    ok: _ramda2.default.pipe(_ramda2.default.propOr(0, 'status'), in200s)(axiosResponse),
    status: axiosResponse.status || null,
    headers: axiosResponse.headers || null,
    config: axiosResponse.config || null,
    data: axiosResponse.data || null
  };
};

/**
  What's the problem for this response?

  TODO: We're losing some error granularity, but i'm cool with that
  until someone cares.
 */
var responseToProblem = function responseToProblem(response) {
  if (response instanceof Error) {
    return _ramda2.default.cond([[_ramda2.default.contains(_ramda2.default.__, TIMEOUT_ERROR_CODES), _ramda2.default.always(TIMEOUT_ERROR)], [_ramda2.default.contains(_ramda2.default.__, NODEJS_CONNECTION_ERROR_CODES), _ramda2.default.always(CONNECTION_ERROR)], [_ramda2.default.T, _ramda2.default.always(UNKNOWN_ERROR)]])(response.code);
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