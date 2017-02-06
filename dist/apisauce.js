'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extends = _interopDefault(require('babel-runtime/helpers/extends'));
var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _toConsumableArray = _interopDefault(require('babel-runtime/helpers/toConsumableArray'));
var _asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));
var axios = _interopDefault(require('axios'));
var R = _interopDefault(require('ramda'));
var RS = _interopDefault(require('ramdasauce'));
var pWaterfall = _interopDefault(require('p-waterfall'));

var _this = undefined;

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
var CANCEL_ERROR = 'CANCEL_ERROR';

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
  var headers = R.merge(DEFAULT_HEADERS, config.headers || {});
  var combinedConfig = R.merge(DEFAULT_CONFIG, R.dissoc('headers', config));

  // create the axios instance
  var instance = axios.create(combinedConfig);

  var monitors = [];
  var addMonitor = function addMonitor(monitor) {
    monitors.push(monitor);
  };

  var requestTransforms = [];
  var asyncRequestTransforms = [];
  var responseTransforms = [];

  var addRequestTransform = function addRequestTransform(transform) {
    return requestTransforms.push(transform);
  };
  var addAsyncRequestTransform = function addAsyncRequestTransform(transform) {
    return asyncRequestTransforms.push(transform);
  };
  var addResponseTransform = function addResponseTransform(transform) {
    return responseTransforms.push(transform);
  };

  // convenience for setting new request headers
  var setHeader = function setHeader(name, value) {
    headers[name] = value;
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

  /**
    Make the request for GET, HEAD, DELETE
   */
  var doRequestWithoutBody = function doRequestWithoutBody(method, url) {
    var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var axiosConfig = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    return doRequest(R.merge({ url: url, params: params, method: method }, axiosConfig));
  };

  /**
    Make the request for POST, PUT, PATCH
   */
  var doRequestWithBody = function doRequestWithBody(method, url) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var axiosConfig = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    return doRequest(R.merge({ url: url, method: method, data: data }, axiosConfig));
  };

  var doRequestTransforms = function doRequestTransforms(transforms, requestConfig) {
    // create an object to feed through the request transforms
    var request = R.pick(['url', 'method', 'data', 'headers', 'params'], requestConfig);

    // go go go!
    R.forEach(function (transform) {
      return transform(request);
    }, transforms);

    // overwrite our axios request with whatever our object looks like now
    return R.merge(requestConfig, request);
  };

  var doAsyncRequestTransforms = function () {
    var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(transforms, requestConfig) {
      var request;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              // create an object to feed through the request transforms
              request = R.pick(['url', 'method', 'data', 'headers', 'params'], requestConfig);

              // await the promise pipeline and return the merged request config

              _context.t0 = R;
              _context.t1 = [requestConfig, request];
              _context.t2 = _toConsumableArray;
              _context.next = 6;
              return pWaterfall(transforms, request);

            case 6:
              _context.t3 = _context.sent;
              _context.t4 = (0, _context.t2)(_context.t3);
              _context.t5 = _context.t1.concat.call(_context.t1, _context.t4);
              return _context.abrupt('return', _context.t0.mergeAll.call(_context.t0, _context.t5));

            case 10:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }));

    return function doAsyncRequestTransforms(_x5, _x6) {
      return _ref.apply(this, arguments);
    };
  }();

  /**
    Make the request with this config!
   */
  var doRequest = function () {
    var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(axiosRequestConfig) {
      var chain;
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:

              axiosRequestConfig.headers = _extends({}, headers, axiosRequestConfig.headers);

              // add the async request transforms

              if (!(asyncRequestTransforms.length > 0)) {
                _context2.next = 5;
                break;
              }

              _context2.next = 4;
              return doAsyncRequestTransforms(asyncRequestTransforms, axiosRequestConfig);

            case 4:
              axiosRequestConfig = _context2.sent;

            case 5:

              // add the request transforms
              if (requestTransforms.length > 0) {
                // overwrite our axios request with whatever our object looks like now
                axiosRequestConfig = doRequestTransforms(requestTransforms, axiosRequestConfig);
              }

              // first convert the axios response, then execute our callback
              chain = R.pipe(R.partial(convertResponse, [RS.toNumber(new Date())]), runMonitors);
              return _context2.abrupt('return', instance.request(axiosRequestConfig).then(chain).catch(chain));

            case 8:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this);
    }));

    return function doRequest(_x7) {
      return _ref2.apply(this, arguments);
    };
  }();

  /**
    Fires after we convert from axios' response into our response.  Exceptions
    raised for each monitor will be ignored.
   */
  var runMonitors = function runMonitors(ourResponse) {
    monitors.forEach(function (monitor) {
      try {
        monitor(ourResponse);
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
    var isError = axiosResponse instanceof Error || axios.isCancel(axiosResponse);
    var response = isError ? axiosResponse.response : axiosResponse;
    var status = response && response.status || null;
    var problem = isError ? getProblemFromError(axiosResponse) : getProblemFromStatus(status);
    var ok = in200s(status);
    var config = axiosResponse.config || null;
    var headers = response && response.headers || null;
    var data = response && response.data || null;

    // give an opportunity for anything to the response transforms to change stuff along the way
    var transformedResponse = { duration: duration, problem: problem, ok: ok, status: status, headers: headers, config: config, data: data };
    if (responseTransforms.length > 0) {
      R.forEach(function (transform) {
        return transform(transformedResponse);
      }, responseTransforms);
    }

    return transformedResponse;
  };

  /**
    What's the problem for this response?
     TODO: We're losing some error granularity, but i'm cool with that
    until someone cares.
   */
  var getProblemFromError = function getProblemFromError(error) {
    // first check if the error message is Network Error (set by axios at 0.12) on platforms other than NodeJS.
    if (error.message === 'Network Error') return NETWORK_ERROR;
    if (axios.isCancel(error)) return CANCEL_ERROR;

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

  // create the base object
  var sauce = {
    axiosInstance: instance,
    monitors: monitors,
    addMonitor: addMonitor,
    requestTransforms: requestTransforms,
    asyncRequestTransforms: asyncRequestTransforms,
    responseTransforms: responseTransforms,
    addRequestTransform: addRequestTransform,
    addAsyncRequestTransform: addAsyncRequestTransform,
    addResponseTransform: addResponseTransform,
    setHeader: setHeader,
    setHeaders: setHeaders,
    headers: headers,
    get: R.partial(doRequestWithoutBody, ['get']),
    delete: R.partial(doRequestWithoutBody, ['delete']),
    head: R.partial(doRequestWithoutBody, ['head']),
    post: R.partial(doRequestWithBody, ['post']),
    put: R.partial(doRequestWithBody, ['put']),
    patch: R.partial(doRequestWithBody, ['patch']),
    link: R.partial(doRequestWithoutBody, ['link']),
    unlink: R.partial(doRequestWithoutBody, ['unlink'])
  };
  // send back the sauce
  return sauce;
};

var apisauce = {
  DEFAULT_HEADERS: DEFAULT_HEADERS,
  NONE: NONE,
  CLIENT_ERROR: CLIENT_ERROR,
  SERVER_ERROR: SERVER_ERROR,
  TIMEOUT_ERROR: TIMEOUT_ERROR,
  CONNECTION_ERROR: CONNECTION_ERROR,
  NETWORK_ERROR: NETWORK_ERROR,
  UNKNOWN_ERROR: UNKNOWN_ERROR,
  create: create
};

exports.DEFAULT_HEADERS = DEFAULT_HEADERS;
exports.NONE = NONE;
exports.CLIENT_ERROR = CLIENT_ERROR;
exports.SERVER_ERROR = SERVER_ERROR;
exports.TIMEOUT_ERROR = TIMEOUT_ERROR;
exports.CONNECTION_ERROR = CONNECTION_ERROR;
exports.NETWORK_ERROR = NETWORK_ERROR;
exports.UNKNOWN_ERROR = UNKNOWN_ERROR;
exports.CANCEL_ERROR = CANCEL_ERROR;
exports.create = create;
exports['default'] = apisauce;
