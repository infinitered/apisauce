'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var axios = _interopDefault(require('axios'));
var R = _interopDefault(require('ramda'));
var RS = _interopDefault(require('ramdasauce'));

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





















var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

Function.prototype.$asyncbind = function $asyncbind(self, catcher) {
  "use strict";

  if (!Function.prototype.$asyncbind) {
    Object.defineProperty(Function.prototype, "$asyncbind", {
      value: $asyncbind,
      enumerable: false,
      configurable: true,
      writable: true
    });
  }

  if (!$asyncbind.trampoline) {
    $asyncbind.trampoline = function trampoline(t, x, s, e, u) {
      return function b(q) {
        while (q) {
          if (q.then) {
            q = q.then(b, e);
            return u ? undefined : q;
          }

          try {
            if (q.pop) {
              if (q.length) return q.pop() ? x.call(t) : q;
              q = s;
            } else q = q.call(t);
          } catch (r) {
            return e(r);
          }
        }
      };
    };
  }

  if (!$asyncbind.LazyThenable) {
    $asyncbind.LazyThenable = function () {
      function isThenable(obj) {
        return obj && obj instanceof Object && typeof obj.then === "function";
      }

      function resolution(p, r, how) {
        try {
          var x = how ? how(r) : r;
          if (p === x) return p.reject(new TypeError("Promise resolution loop"));

          if (isThenable(x)) {
            x.then(function (y) {
              resolution(p, y);
            }, function (e) {
              p.reject(e);
            });
          } else {
            p.resolve(x);
          }
        } catch (ex) {
          p.reject(ex);
        }
      }

      function Chained() {}

      
      Chained.prototype = {
        resolve: _unchained,
        reject: _unchained,
        then: thenChain
      };

      function _unchained(v) {}

      function thenChain(res, rej) {
        this.resolve = res;
        this.reject = rej;
      }

      function then(res, rej) {
        var chain = new Chained();

        try {
          this._resolver(function (value) {
            return isThenable(value) ? value.then(res, rej) : resolution(chain, value, res);
          }, function (ex) {
            resolution(chain, ex, rej);
          });
        } catch (ex) {
          resolution(chain, ex, rej);
        }

        return chain;
      }

      function Thenable(resolver) {
        this._resolver = resolver;
        this.then = then;
      }

      

      Thenable.resolve = function (v) {
        return Thenable.isThenable(v) ? v : {
          then: function then(resolve) {
            return resolve(v);
          }
        };
      };

      Thenable.isThenable = isThenable;
      return Thenable;
    }();

    $asyncbind.EagerThenable = $asyncbind.Thenable = ($asyncbind.EagerThenableFactory = function (tick) {
      tick = tick || (typeof process === 'undefined' ? 'undefined' : _typeof(process)) === "object" && process.nextTick || typeof setImmediate === "function" && setImmediate || function (f) {
        setTimeout(f, 0);
      };

      var soon = function () {
        var fq = [],
            fqStart = 0,
            bufferSize = 1024;

        function callQueue() {
          while (fq.length - fqStart) {
            try {
              fq[fqStart]();
            } catch (ex) {}

            fq[fqStart++] = undefined;

            if (fqStart === bufferSize) {
              fq.splice(0, bufferSize);
              fqStart = 0;
            }
          }
        }

        return function (fn) {
          fq.push(fn);
          if (fq.length - fqStart === 1) tick(callQueue);
        };
      }();

      function Zousan(func) {
        if (func) {
          var me = this;
          func(function (arg) {
            me.resolve(arg);
          }, function (arg) {
            me.reject(arg);
          });
        }
      }

      Zousan.prototype = {
        resolve: function resolve(value) {
          if (this.state !== undefined) return;
          if (value === this) return this.reject(new TypeError("Attempt to resolve promise with self"));
          var me = this;

          if (value && (typeof value === "function" || (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === "object")) {
            try {
              var first = 0;
              var then = value.then;

              if (typeof then === "function") {
                then.call(value, function (ra) {
                  if (!first++) {
                    me.resolve(ra);
                  }
                }, function (rr) {
                  if (!first++) {
                    me.reject(rr);
                  }
                });
                return;
              }
            } catch (e) {
              if (!first) this.reject(e);
              return;
            }
          }

          this.state = STATE_FULFILLED;
          this.v = value;
          if (me.c) soon(function () {
            for (var n = 0, l = me.c.length; n < l; n++) {
              STATE_FULFILLED(me.c[n], value);
            }
          });
        },
        reject: function reject(reason) {
          if (this.state !== undefined) return;
          this.state = STATE_REJECTED;
          this.v = reason;
          var clients = this.c;
          if (clients) soon(function () {
            for (var n = 0, l = clients.length; n < l; n++) {
              STATE_REJECTED(clients[n], reason);
            }
          });
        },
        then: function then(onF, onR) {
          var p = new Zousan();
          var client = {
            y: onF,
            n: onR,
            p: p
          };

          if (this.state === undefined) {
            if (this.c) this.c.push(client);else this.c = [client];
          } else {
            var s = this.state,
                a = this.v;
            soon(function () {
              s(client, a);
            });
          }

          return p;
        }
      };

      function STATE_FULFILLED(c, arg) {
        if (typeof c.y === "function") {
          try {
            var yret = c.y.call(undefined, arg);
            c.p.resolve(yret);
          } catch (err) {
            c.p.reject(err);
          }
        } else c.p.resolve(arg);
      }

      function STATE_REJECTED(c, reason) {
        if (typeof c.n === "function") {
          try {
            var yret = c.n.call(undefined, reason);
            c.p.resolve(yret);
          } catch (err) {
            c.p.reject(err);
          }
        } else c.p.reject(reason);
      }

      Zousan.resolve = function (val) {
        if (val && val instanceof Zousan) return val;
        var z = new Zousan();
        z.resolve(val);
        return z;
      };

      Zousan.reject = function (err) {
        if (err && err instanceof Zousan) return err;
        var z = new Zousan();
        z.reject(err);
        return z;
      };

      Zousan.version = "2.3.3-nodent";
      return Zousan;
    })();
  }

  var resolver = this;

  switch (catcher) {
    case true:
      return new $asyncbind.Thenable(boundThen);

    case 0:
      return new $asyncbind.LazyThenable(boundThen);

    case undefined:
      boundThen.then = boundThen;
      return boundThen;

    default:
      return function () {
        try {
          return resolver.apply(self, arguments);
        } catch (ex) {
          return catcher(ex);
        }
      };
  }

  function boundThen() {
    return resolver.apply(self, arguments);
  }
};

// check for an invalid config
var isInvalidConfig = R.anyPass([R.isNil, R.isEmpty, R.complement(R.has('baseURL')), R.complement(R.propIs(String, 'baseURL')), R.propSatisfies(R.isEmpty, 'baseURL')]);

/**
 * Are we dealing with a promise?
 */
var isPromise = function isPromise(obj) {
  return !!obj && ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
};

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
   * Sets a new base URL.
   */
  var setBaseURL = function setBaseURL(newURL) {
    instance.defaults.baseURL = newURL;
    return instance;
  };

  /**
   * Gets the current base URL used by axios.
   */
  var getBaseURL = function getBaseURL() {
    return instance.defaults.baseURL;
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

  /**
    Make the request with this config!
   */
  var doRequest = function doRequest(axiosRequestConfig) {
    return new Promise(function ($return, $error) {
      var index, transform, chain;

      axiosRequestConfig.headers = _extends({}, headers, axiosRequestConfig.headers);

      // add the request transforms
      if (requestTransforms.length > 0) {
        // overwrite our axios request with whatever our object looks like now
        // axiosRequestConfig = doRequestTransforms(requestTransforms, axiosRequestConfig)
        R.forEach(function (transform) {
          return transform(axiosRequestConfig);
        }, requestTransforms);
      }

      // add the async request transforms
      if (asyncRequestTransforms.length > 0) {
        index = 0;
        return Function.$asyncbind.trampoline(this, $Loop_3_exit, $Loop_3_step, $error, true)($Loop_3);

        function $Loop_3() {
          if (index < asyncRequestTransforms.length) {
            transform = asyncRequestTransforms[index](axiosRequestConfig);
            if (isPromise(transform)) {
              return transform.then(function ($await_6) {
                return $If_5.call(this);
              }.$asyncbind(this, $error), $error);
            } else {
              return transform(axiosRequestConfig).then(function ($await_7) {
                return $If_5.call(this);
              }.$asyncbind(this, $error), $error);
            }

            function $If_5() {
              return $Loop_3_step;
            }
          } else return [1];
        }

        function $Loop_3_step() {
          index++;
          return $Loop_3;
        }

        function $Loop_3_exit() {
          return $If_2.call(this);
        }
      }

      // after the call, convert the axios response, then execute our monitors

      function $If_2() {
        chain = R.pipe(R.partial(convertResponse, [RS.toNumber(new Date())]), runMonitors);

        return $return(instance.request(axiosRequestConfig).then(chain).catch(chain));
      }

      return $If_2.call(this);
    }.$asyncbind(this));
  };

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
    setBaseURL: setBaseURL,
    getBaseURL: getBaseURL,
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
