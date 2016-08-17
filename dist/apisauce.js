'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var axios = _interopDefault(require('axios'));
var R = _interopDefault(require('ramda'));
var RS = _interopDefault(require('ramdasauce'));

// check for an invalid config
var isInvalidConfig = R.anyPass([R.isNil, R.isEmpty, R.complement(R.has('baseURL')), R.complement(R.propIs(String, 'baseURL')), R.propSatisfies(R.isEmpty, 'baseURL')]);

// the default headers given to axios
var DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// the default configuration for axios, default headers will also be merged in
var DEFAULT_CONFIG = {
  timeout: 0
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
var in200s = RS.isWithin(200, 299);
var in400s = RS.isWithin(400, 499);
var in500s = RS.isWithin(500, 599);

/**
  Creates a instance of our API using the configuration.
 */
var create = function create(config) {
  // quick sanity check
  if (isInvalidConfig(config)) throw new Error('config must have a baseURL');

  // combine the user's defaults with ours
  var mergedHeaders = R.merge(DEFAULT_HEADERS, config.headers || {});
  var combinedConfig = R.merge(DEFAULT_CONFIG, R.merge(config, { headers: mergedHeaders }));

  // create the axios instance
  var instance = axios.create(combinedConfig);

  // immediate reset headers because axios kept its own defaults
  instance.defaults.headers = combinedConfig.headers;

  var monitors = [];
  var addMonitor = function addMonitor(monitor) {
    monitors.push(monitor);
  };

  // convenience for setting new request headers
  var setHeader = function setHeader(name, value) {
    instance.defaults.headers[name] = value;
    return instance;
  };

  // sets headers in bulk
  var setHeaders = function setHeaders(headers) {
    var keys = R.keys(headers);
    R.forEach(function (header) {
      return setHeader(header, headers[header]);
    }, keys);
    return instance;
  };

  // create the base object
  var sauce = {
    axiosInstance: instance,
    monitors: monitors,
    addMonitor: addMonitor,
    setHeader: setHeader,
    setHeaders: setHeaders
  };

  // attach functions for each our HTTP verbs
  sauce.get = R.partial(doRequestWithoutBody, [sauce, 'get']);
  sauce.delete = R.partial(doRequestWithoutBody, [sauce, 'delete']);
  sauce.head = R.partial(doRequestWithoutBody, [sauce, 'head']);
  sauce.post = R.partial(doRequestWithBody, [sauce, 'post']);
  sauce.put = R.partial(doRequestWithBody, [sauce, 'put']);
  sauce.patch = R.partial(doRequestWithBody, [sauce, 'patch']);

  // send it back
  return sauce;
};

/**
  Make the request for GET, HEAD, DELETE
 */
var doRequestWithoutBody = function doRequestWithoutBody(api, method, url) {
  var params = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];
  var axiosConfig = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

  return doRequest(api, R.merge({ url: url, params: params, method: method }, axiosConfig));
};

/**
  Make the request for POST, PUT, PATCH
 */
var doRequestWithBody = function doRequestWithBody(api, method, url) {
  var data = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];
  var axiosConfig = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

  return doRequest(api, R.merge({ url: url, method: method, data: data }, axiosConfig));
};

/**
  Make the request with this config!
 */
var doRequest = function doRequest(api, axiosRequestConfig) {
  var axiosInstance = api.axiosInstance;

  var startedAt = RS.toNumber(new Date());

  // first convert the axios response, then execute our callback
  var chain = R.pipe(R.partial(convertResponse, [startedAt]), R.partial(runMonitors, [api]));

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
var convertResponse = function convertResponse(startedAt, axiosResponse) {
  var end = RS.toNumber(new Date());
  var duration = end - startedAt;

  // new in Axios 0.13 -- some data could be buried 1 level now
  var isError = axiosResponse instanceof Error;
  var response = isError ? axiosResponse.response : axiosResponse;
  var data = response && response.data || null;
  var status = response && response.status || null;
  var problem = isError ? getProblemFromError(axiosResponse) : getProblemFromStatus(status);

  return {
    duration: duration,
    problem: problem,
    ok: in200s(status),
    status: status,
    headers: response && response.headers || null,
    config: response && response.config || null,
    data: data
  };
};

/**
  What's the problem for this response?

  TODO: We're losing some error granularity, but i'm cool with that
  until someone cares.
 */
var getProblemFromError = function getProblemFromError(error) {
  // first check if the error message is Network Error (set by axios at 0.12) on platforms other than NodeJS.
  if (error.message === 'Network Error') return NETWORK_ERROR;
  // then check the specific error code
  return R.cond([
  // if we don't have an error code, we have a response status
  [R.isNil, function () {
    return getProblemFromStatus(error.response.status);
  }], [R.contains(R.__, TIMEOUT_ERROR_CODES), R.always(TIMEOUT_ERROR)], [R.contains(R.__, NODEJS_CONNECTION_ERROR_CODES), R.always(CONNECTION_ERROR)], [R.T, R.always(UNKNOWN_ERROR)]])(error.code);
};

/**
 * Given a HTTP status code, return back the appropriate problem enum.
 */
var getProblemFromStatus = function getProblemFromStatus(status) {
  return R.cond([[R.isNil, R.always(UNKNOWN_ERROR)], [in200s, R.always(NONE)], [in400s, R.always(CLIENT_ERROR)], [in500s, R.always(SERVER_ERROR)], [R.T, R.always(UNKNOWN_ERROR)]])(status);
};

exports.DEFAULT_HEADERS = DEFAULT_HEADERS;
exports.NONE = NONE;
exports.CLIENT_ERROR = CLIENT_ERROR;
exports.SERVER_ERROR = SERVER_ERROR;
exports.TIMEOUT_ERROR = TIMEOUT_ERROR;
exports.CONNECTION_ERROR = CONNECTION_ERROR;
exports.NETWORK_ERROR = NETWORK_ERROR;
exports.UNKNOWN_ERROR = UNKNOWN_ERROR;
exports.create = create;
exports.getProblemFromError = getProblemFromError;
exports.getProblemFromStatus = getProblemFromStatus;