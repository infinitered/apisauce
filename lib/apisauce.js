import axios from 'axios'
import R from 'ramda'

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
const toNumber = R.cond([
  [R.isNil, R.identity],
  [R.is(Number), R.identity],
  [R.T, (x) => Number(x)]
])

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
const isWithin = R.curry((min, max, value) => {
  const isNumber = R.is(Number)
  return isNumber(min) && isNumber(max) && isNumber(value) && R.gte(value, min) && R.gte(max, value)
})

// check for an invalid config
const isInvalidConfig = R.anyPass([
  R.isNil,
  R.isEmpty,
  R.complement(R.has('baseURL')),
  R.complement(R.propIs(String, 'baseURL')),
  R.propSatisfies(R.isEmpty, 'baseURL')
])

/**
 * Are we dealing with a promise?
 */
const isPromise = obj =>
  !!obj &&
  (typeof obj === 'object' || typeof obj === 'function') &&
  typeof obj.then === 'function'

// the default headers given to axios
export const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}

// the default configuration for axios, default headers will also be merged in
const DEFAULT_CONFIG = {
  timeout: 0
}

export const NONE = null
export const CLIENT_ERROR = 'CLIENT_ERROR'
export const SERVER_ERROR = 'SERVER_ERROR'
export const TIMEOUT_ERROR = 'TIMEOUT_ERROR'
export const CONNECTION_ERROR = 'CONNECTION_ERROR'
export const NETWORK_ERROR = 'NETWORK_ERROR'
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR'
export const CANCEL_ERROR = 'CANCEL_ERROR'

const TIMEOUT_ERROR_CODES = ['ECONNABORTED']
const NODEJS_CONNECTION_ERROR_CODES = ['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET']
const in200s = isWithin(200, 299)
const in400s = isWithin(400, 499)
const in500s = isWithin(500, 599)

/**
  Creates a instance of our API using the configuration.
 */
export const create = (config) => {
  // quick sanity check
  if (isInvalidConfig(config)) throw new Error('config must have a baseURL')

  // combine the user's defaults with ours
  const headers = R.merge(DEFAULT_HEADERS, config.headers || {})
  const combinedConfig = R.merge(DEFAULT_CONFIG, R.dissoc('headers', config))

  // create the axios instance
  const instance = axios.create(combinedConfig)

  const monitors = []
  const addMonitor = (monitor) => {
    monitors.push(monitor)
  }

  const requestTransforms = []
  const asyncRequestTransforms = []
  const responseTransforms = []

  const addRequestTransform = transform => requestTransforms.push(transform)
  const addAsyncRequestTransform = transform => asyncRequestTransforms.push(transform)
  const addResponseTransform = transform => responseTransforms.push(transform)

  // convenience for setting new request headers
  const setHeader = (name, value) => {
    headers[name] = value
    return instance
  }

  // sets headers in bulk
  const setHeaders = (headers) => {
    const keys = R.keys(headers)
    R.forEach(header => setHeader(header, headers[header]), keys)
    return instance
  }

  /**
   * Sets a new base URL.
   */
  const setBaseURL = newURL => {
    instance.defaults.baseURL = newURL
    return instance
  }

  /**
   * Gets the current base URL used by axios.
   */
  const getBaseURL = () => {
    return instance.defaults.baseURL
  }

  /**
    Make the request for GET, HEAD, DELETE
   */
  const doRequestWithoutBody = (method, url, params = {}, axiosConfig = {}) => {
    return doRequest(R.merge({url, params, method}, axiosConfig))
  }

  /**
    Make the request for POST, PUT, PATCH
   */
  const doRequestWithBody = (method, url, data = null, axiosConfig = {}) => {
    return doRequest(R.merge({ url, method, data }, axiosConfig))
  }

  /**
    Make the request with this config!
   */
  const doRequest = async (axiosRequestConfig) => {
    axiosRequestConfig.headers = {
      ...headers,
      ...axiosRequestConfig.headers
    }

    // add the request transforms
    if (requestTransforms.length > 0) {
      // overwrite our axios request with whatever our object looks like now
      // axiosRequestConfig = doRequestTransforms(requestTransforms, axiosRequestConfig)
      R.forEach(transform => transform(axiosRequestConfig), requestTransforms)
    }

    // add the async request transforms
    if (asyncRequestTransforms.length > 0) {
      for (let index = 0; index < asyncRequestTransforms.length; index++) {
        const transform = asyncRequestTransforms[index](axiosRequestConfig)
        if (isPromise(transform)) {
          await transform
        } else {
          await transform(axiosRequestConfig)
        }
      }
    }

    // after the call, convert the axios response, then execute our monitors
    const chain = R.pipe(
      R.partial(convertResponse, [toNumber(new Date())]),
      runMonitors
    )

    return instance
      .request(axiosRequestConfig)
      .then(chain)
      .catch(chain)
  }

  /**
    Fires after we convert from axios' response into our response.  Exceptions
    raised for each monitor will be ignored.
   */
  const runMonitors = (ourResponse) => {
    monitors.forEach((monitor) => {
      try {
        monitor(ourResponse)
      } catch (error) {
        // all monitor complaints will be ignored
      }
    })
    return ourResponse
  }

  /**
    Converts an axios response/error into our response.
   */
  const convertResponse = (startedAt, axiosResponse) => {
    const end = toNumber(new Date())
    const duration = (end - startedAt)

    // new in Axios 0.13 -- some data could be buried 1 level now
    const isError = axiosResponse instanceof Error || axios.isCancel(axiosResponse)
    const response = isError ? axiosResponse.response : axiosResponse
    const status = (response && response.status) || null
    const problem = isError ? getProblemFromError(axiosResponse) : getProblemFromStatus(status)
    const ok = in200s(status)
    const config = axiosResponse.config || null
    const headers = (response && response.headers) || null
    let data = (response && response.data) || null

    // give an opportunity for anything to the response transforms to change stuff along the way
    let transformedResponse = { duration, problem, ok, status, headers, config, data }
    if (responseTransforms.length > 0) {
      R.forEach(transform => transform(transformedResponse), responseTransforms)
    }

    return transformedResponse
  }

  /**
    What's the problem for this response?

    TODO: We're losing some error granularity, but i'm cool with that
    until someone cares.
   */
  const getProblemFromError = (error) => {
    // first check if the error message is Network Error (set by axios at 0.12) on platforms other than NodeJS.
    if (error.message === 'Network Error') return NETWORK_ERROR
    if (axios.isCancel(error)) return CANCEL_ERROR

    // then check the specific error code
    return R.cond([
      // if we don't have an error code, we have a response status
      [R.isNil, () => getProblemFromStatus(error.response.status)],
      [R.contains(R.__, TIMEOUT_ERROR_CODES), R.always(TIMEOUT_ERROR)],
      [R.contains(R.__, NODEJS_CONNECTION_ERROR_CODES), R.always(CONNECTION_ERROR)],
      [R.T, R.always(UNKNOWN_ERROR)]
    ])(error.code)
  }

  /**
   * Given a HTTP status code, return back the appropriate problem enum.
   */
  const getProblemFromStatus = status => {
    return R.cond([
      [R.isNil, R.always(UNKNOWN_ERROR)],
      [in200s, R.always(NONE)],
      [in400s, R.always(CLIENT_ERROR)],
      [in500s, R.always(SERVER_ERROR)],
      [R.T, R.always(UNKNOWN_ERROR)]
    ])(status)
  }

  // create the base object
  const sauce = {
    axiosInstance: instance,
    monitors,
    addMonitor,
    requestTransforms,
    asyncRequestTransforms,
    responseTransforms,
    addRequestTransform,
    addAsyncRequestTransform,
    addResponseTransform,
    setHeader,
    setHeaders,
    headers,
    setBaseURL,
    getBaseURL,
    get: R.partial(doRequestWithoutBody, ['get']),
    delete: R.partial(doRequestWithoutBody, ['delete']),
    head: R.partial(doRequestWithoutBody, ['head']),
    post: R.partial(doRequestWithBody, ['post']),
    put: R.partial(doRequestWithBody, ['put']),
    patch: R.partial(doRequestWithBody, ['patch']),
    link: R.partial(doRequestWithoutBody, ['link']),
    unlink: R.partial(doRequestWithoutBody, ['unlink'])
  }
  // send back the sauce
  return sauce
}

export default {
  DEFAULT_HEADERS,
  NONE,
  CLIENT_ERROR,
  SERVER_ERROR,
  TIMEOUT_ERROR,
  CONNECTION_ERROR,
  NETWORK_ERROR,
  UNKNOWN_ERROR,
  create
}
