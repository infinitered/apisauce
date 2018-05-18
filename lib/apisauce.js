var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
import axios from 'axios';
import { cond, isNil, identity, is, T, curry, gte, anyPass, isEmpty, ifElse, complement, has, prop, propIs, propSatisfies, merge, dissoc, keys, forEach, pipe, partial, contains, always } from 'ramda';
/**
 * Converts the parameter to a number.
 *
 * Number, null, and undefined will return themselves,
 * but everything else will be convert to a Number, or
 * die trying.
 *
 * @param {String} the String to convert
 * @return {Number} the Number version
 * @example
 * toNumber('7') //=> 7
 */
var toNumber = cond([
    [isNil, identity],
    [is(Number), identity],
    [T, function (x) { return Number(x); }]
]);
/**
 * Given a min and max, determines if the value is included
 * in the range.
 *
 * This function is curried.
 *
 * @sig Number a -> a -> a -> b
 * @param {Number} the minimum number
 * @param {Number} the maximum number
 * @param {Number} the value to test
 * @return {Boolean} is the value in the range?
 * @example
 * isWithin(1, 5, 3) //=> true
 * isWithin(1, 5, 1) //=> true
 * isWithin(1, 5, 5) //=> true
 * isWithin(1, 5, 5.1) //=> false
 */
var isWithin = curry(function (min, max, value) {
    var isNumber = is(Number);
    return (isNumber(min) &&
        isNumber(max) &&
        isNumber(value) &&
        gte(value, min) &&
        gte(max, value));
});
// a workaround to deal with __ not being available from the ramda types in typescript
var containsText = function (textToSearch) { return function (list) { return contains(list, textToSearch); }; };
// check for an invalid config
var isInvalidConfig = anyPass([
    isNil,
    isEmpty,
    complement(has('baseURL')),
    complement(propIs(String, 'baseURL')),
    propSatisfies(isEmpty, 'baseURL')
]);
/**
 * Are we dealing with a promise?
 */
var isPromise = function (obj) {
    return !!obj &&
        (typeof obj === 'object' || typeof obj === 'function') &&
        typeof obj.then === 'function';
};
// the default headers given to axios
export var DEFAULT_HEADERS = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
};
// the default configuration for axios, default headers will also be merged in
var DEFAULT_CONFIG = {
    timeout: 0
};
export var NONE = null;
export var CLIENT_ERROR = 'CLIENT_ERROR';
export var SERVER_ERROR = 'SERVER_ERROR';
export var TIMEOUT_ERROR = 'TIMEOUT_ERROR';
export var CONNECTION_ERROR = 'CONNECTION_ERROR';
export var NETWORK_ERROR = 'NETWORK_ERROR';
export var UNKNOWN_ERROR = 'UNKNOWN_ERROR';
export var CANCEL_ERROR = 'CANCEL_ERROR';
var TIMEOUT_ERROR_CODES = ['ECONNABORTED'];
var NODEJS_CONNECTION_ERROR_CODES = [
    'ENOTFOUND',
    'ECONNREFUSED',
    'ECONNRESET'
];
var in200s = isWithin(200, 299);
var in400s = isWithin(400, 499);
var in500s = isWithin(500, 599);
var statusNil = ifElse(isNil, always(undefined), prop('status'));
/**
  Creates a instance of our API using the configuration.
 */
export var create = function (config) {
    // quick sanity check
    if (isInvalidConfig(config))
        throw new Error('config must have a baseURL');
    // combine the user's defaults with ours
    var headers = merge(DEFAULT_HEADERS, config.headers || {});
    var combinedConfig = merge(DEFAULT_CONFIG, dissoc('headers', config));
    // create the axios instance
    var instance = axios.create(combinedConfig);
    var monitors = [];
    var addMonitor = function (monitor) {
        monitors.push(monitor);
    };
    var requestTransforms = [];
    var asyncRequestTransforms = [];
    var responseTransforms = [];
    var addRequestTransform = function (transform) { return requestTransforms.push(transform); };
    var addAsyncRequestTransform = function (transform) {
        return asyncRequestTransforms.push(transform);
    };
    var addResponseTransform = function (transform) { return responseTransforms.push(transform); };
    // convenience for setting new request headers
    var setHeader = function (name, value) {
        headers[name] = value;
        return instance;
    };
    // sets headers in bulk
    var setHeaders = function (headers) {
        forEach(function (header) { return setHeader(header, headers[header]); }, keys(headers));
        return instance;
    };
    // remove header
    var deleteHeader = function (name) {
        delete headers[name];
        return instance;
    };
    /**
     * Sets a new base URL.
     */
    var setBaseURL = function (newURL) {
        instance.defaults.baseURL = newURL;
        return instance;
    };
    /**
     * Gets the current base URL used by axios.
     */
    var getBaseURL = function () {
        return instance.defaults.baseURL;
    };
    /**
      Make the request for GET, HEAD, DELETE
     */
    var doRequestWithoutBody = function (method, url, params, axiosConfig) {
        if (params === void 0) { params = {}; }
        if (axiosConfig === void 0) { axiosConfig = {}; }
        return doRequest(merge({ url: url, params: params, method: method }, axiosConfig));
    };
    /**
      Make the request for POST, PUT, PATCH
     */
    var doRequestWithBody = function (method, url, data, axiosConfig) {
        if (data === void 0) { data = null; }
        if (axiosConfig === void 0) { axiosConfig = {}; }
        return doRequest(merge({ url: url, method: method, data: data }, axiosConfig));
    };
    /**
      Make the request with this config!
     */
    var doRequest = function (axiosRequestConfig) { return __awaiter(_this, void 0, void 0, function () {
        var index, transform, chain;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    axiosRequestConfig.headers = __assign({}, headers, axiosRequestConfig.headers);
                    // add the request transforms
                    if (requestTransforms.length > 0) {
                        // overwrite our axios request with whatever our object looks like now
                        // axiosRequestConfig = doRequestTransforms(requestTransforms, axiosRequestConfig)
                        forEach(function (transform) { return transform(axiosRequestConfig); }, requestTransforms);
                    }
                    if (!(asyncRequestTransforms.length > 0)) return [3 /*break*/, 6];
                    index = 0;
                    _a.label = 1;
                case 1:
                    if (!(index < asyncRequestTransforms.length)) return [3 /*break*/, 6];
                    transform = asyncRequestTransforms[index](axiosRequestConfig);
                    if (!isPromise(transform)) return [3 /*break*/, 3];
                    return [4 /*yield*/, transform];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, transform(axiosRequestConfig)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    index++;
                    return [3 /*break*/, 1];
                case 6:
                    chain = pipe(convertResponse(toNumber(new Date())), 
                    // partial(convertResponse, [toNumber(new Date())]),
                    runMonitors);
                    return [2 /*return*/, instance.request(axiosRequestConfig).then(chain).catch(chain)];
            }
        });
    }); };
    /**
      Fires after we convert from axios' response into our response.  Exceptions
      raised for each monitor will be ignored.
     */
    var runMonitors = function (ourResponse) {
        monitors.forEach(function (monitor) {
            try {
                monitor(ourResponse);
            }
            catch (error) {
                // all monitor complaints will be ignored
            }
        });
        return ourResponse;
    };
    /**
      Converts an axios response/error into our response.
     */
    var convertResponse = curry(function (startedAt, axiosResult) {
        var end = toNumber(new Date());
        var duration = end - startedAt;
        // new in Axios 0.13 -- some data could be buried 1 level now
        var isError = axiosResult instanceof Error || axios.isCancel(axiosResult);
        var axiosResponse = axiosResult;
        var axiosError = axiosResult;
        var response = isError ? axiosError.response : axiosResponse;
        var status = (response && response.status) || null;
        var problem = isError
            ? getProblemFromError(axiosResult)
            : getProblemFromStatus(status);
        var originalError = isError
            ? axiosError
            : null;
        var ok = in200s(status);
        var config = axiosResult.config || null;
        var headers = (response && response.headers) || null;
        var data = (response && response.data) || null;
        // give an opportunity for anything to the response transforms to change stuff along the way
        var transformedResponse = {
            duration: duration,
            problem: problem,
            originalError: originalError,
            ok: ok,
            status: status,
            headers: headers,
            config: config,
            data: data
        };
        if (responseTransforms.length > 0) {
            forEach(function (transform) { return transform(transformedResponse); }, responseTransforms);
        }
        return transformedResponse;
    });
    /**
      What's the problem for this response?
  
      TODO: We're losing some error granularity, but i'm cool with that
      until someone cares.
     */
    var getProblemFromError = function (error) {
        // first check if the error message is Network Error (set by axios at 0.12) on platforms other than NodeJS.
        if (error.message === 'Network Error')
            return NETWORK_ERROR;
        if (axios.isCancel(error))
            return CANCEL_ERROR;
        // then check the specific error code
        return cond([
            // if we don't have an error code, we have a response status
            [isNil, function () { return getProblemFromStatus(statusNil(error.response)); }],
            [containsText(TIMEOUT_ERROR_CODES), always(TIMEOUT_ERROR)],
            [containsText(NODEJS_CONNECTION_ERROR_CODES), always(CONNECTION_ERROR)],
            [T, always(UNKNOWN_ERROR)]
        ])(error.code);
    };
    /**
     * Given a HTTP status code, return back the appropriate problem enum.
     */
    var getProblemFromStatus = function (status) {
        return cond([
            [isNil, always(UNKNOWN_ERROR)],
            [in200s, always(NONE)],
            [in400s, always(CLIENT_ERROR)],
            [in500s, always(SERVER_ERROR)],
            [T, always(UNKNOWN_ERROR)]
        ])(status);
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
        deleteHeader: deleteHeader,
        headers: headers,
        setBaseURL: setBaseURL,
        getBaseURL: getBaseURL,
        get: partial(doRequestWithoutBody, ['get']),
        delete: partial(doRequestWithoutBody, ['delete']),
        head: partial(doRequestWithoutBody, ['head']),
        post: partial(doRequestWithBody, ['post']),
        put: partial(doRequestWithBody, ['put']),
        patch: partial(doRequestWithBody, ['patch']),
        link: partial(doRequestWithoutBody, ['link']),
        unlink: partial(doRequestWithoutBody, ['unlink'])
    };
    // send back the sauce
    return sauce;
};
export default {
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
