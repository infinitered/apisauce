import axios from 'axios'
import { AxiosResponse, AxiosError } from 'axios'
import {
  cond,
  isNil,
  identity,
  is,
  T,
  curry,
  gte,
  anyPass,
  isEmpty,
  ifElse,
  complement,
  has,
  prop,
  propIs,
  propSatisfies,
  merge,
  dissoc,
  keys,
  forEach,
  pipe,
  partial,
  contains,
  always
} from 'ramda'

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
const toNumber = cond([
  [isNil, identity],
  [is(Number), identity],
  [T, x => Number(x)]
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
const isWithin = curry((min, max, value) => {
  const isNumber = is(Number)
  return (
    isNumber(min) &&
    isNumber(max) &&
    isNumber(value) &&
    gte(value, min) &&
    gte(max, value)
  )
})

// a workaround to deal with __ not being available from the ramda types in typescript
const containsText = textToSearch => list => contains(list, textToSearch)

/**
 * Are we dealing with a promise?
 */
const isPromise = obj =>
  !!obj &&
  (typeof obj === 'object' || typeof obj === 'function') &&
  typeof obj.then === 'function'

// the default headers given to axios
export const DEFAULT_HEADERS = {
  Accept: 'application/json',
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
const NODEJS_CONNECTION_ERROR_CODES = [
  'ENOTFOUND',
  'ECONNREFUSED',
  'ECONNRESET'
]
const in200s = isWithin(200, 299)
const in400s = isWithin(400, 499)
const in500s = isWithin(500, 599)
const statusNil = ifElse(isNil, always(undefined), prop('status'))

/**
  What's the problem for this axios response?
  */
export const getProblemFromError = error => {
  // first check if the error message is Network Error (set by axios at 0.12) on platforms other than NodeJS.
  if (error.message === 'Network Error') return NETWORK_ERROR
  if (axios.isCancel(error)) return CANCEL_ERROR

  // then check the specific error code
  return cond([
    // if we don't have an error code, we have a response status
    [isNil, () => getProblemFromStatus(statusNil(error.response))],
    [containsText(TIMEOUT_ERROR_CODES), always(TIMEOUT_ERROR)],
    [containsText(NODEJS_CONNECTION_ERROR_CODES), always(CONNECTION_ERROR)],
    [T, always(UNKNOWN_ERROR)]
  ])(error.code)
}

/**
 * Given a HTTP status code, return back the appropriate problem enum.
 */
export const getProblemFromStatus = status => {
  return cond([
    [isNil, always(UNKNOWN_ERROR)],
    [in200s, always(NONE)],
    [in400s, always(CLIENT_ERROR)],
    [in500s, always(SERVER_ERROR)],
    [T, always(UNKNOWN_ERROR)]
  ])(status)
}

/**
  Creates a instance of our API using the configuration.
 */
export const create = config => {

  // combine the user's defaults with ours
  const headers = merge(DEFAULT_HEADERS, config.headers || {})
  const combinedConfig = merge(DEFAULT_CONFIG, dissoc('headers', config))

  // create the axios instance
  const instance = axios.create(combinedConfig)

  const monitors = []
  const addMonitor = monitor => {
    monitors.push(monitor)
  }

  const requestTransforms = []
  const asyncRequestTransforms = []
  const responseTransforms = []

  const addRequestTransform = transform => requestTransforms.push(transform)
  const addAsyncRequestTransform = transform =>
    asyncRequestTransforms.push(transform)
  const addResponseTransform = transform => responseTransforms.push(transform)

  // convenience for setting new request headers
  const setHeader = (name, value) => {
    headers[name] = value
    return instance
  }

  // sets headers in bulk
  const setHeaders = headers => {
    forEach(header => setHeader(header, headers[header]), keys(headers))
    return instance
  }

  // remove header
  const deleteHeader = name => {
    delete headers[name]
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
    return doRequest(merge({ url, params, method }, axiosConfig))
  }

  /**
    Make the request for POST, PUT, PATCH
   */
  const doRequestWithBody = (method, url, data = null, axiosConfig = {}) => {
    return doRequest(merge({ url, method, data }, axiosConfig))
  }

  /**
    Make the request with this config!
   */
  const doRequest = async axiosRequestConfig => {
    axiosRequestConfig.headers = {
      ...headers,
      ...axiosRequestConfig.headers
    }

    // add the request transforms
    if (requestTransforms.length > 0) {
      // overwrite our axios request with whatever our object looks like now
      // axiosRequestConfig = doRequestTransforms(requestTransforms, axiosRequestConfig)
      forEach(transform => transform(axiosRequestConfig), requestTransforms)
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
    const chain = pipe(
      convertResponse(toNumber(new Date())),
      // partial(convertResponse, [toNumber(new Date())]),
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
  const runMonitors = ourResponse => {
    monitors.forEach(monitor => {
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
  const convertResponse = curry(
    (startedAt: number, axiosResult: AxiosResponse | AxiosError) => {
      const end: number = toNumber(new Date())
      const duration: number = end - startedAt

      // new in Axios 0.13 -- some data could be buried 1 level now
      const isError =
        axiosResult instanceof Error || axios.isCancel(axiosResult)
      const axiosResponse = axiosResult as AxiosResponse
      const axiosError = axiosResult as AxiosError
      const response = isError ? axiosError.response : axiosResponse
      const status = (response && response.status) || null
      const problem = isError
        ? getProblemFromError(axiosResult)
        : getProblemFromStatus(status)
      const originalError = isError ? axiosError : null
      const ok = in200s(status)
      const config = axiosResult.config || null
      const headers = (response && response.headers) || null
      let data = (response && response.data) || null

      // give an opportunity for anything to the response transforms to change stuff along the way
      let transformedResponse = {
        duration,
        problem,
        originalError,
        ok,
        status,
        headers,
        config,
        data
      }
      if (responseTransforms.length > 0) {
        forEach(transform => transform(transformedResponse), responseTransforms)
      }

      return transformedResponse
    }
  )

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
    deleteHeader,
    headers,
    setBaseURL,
    getBaseURL,
    get: partial(doRequestWithoutBody, ['get']),
    delete: partial(doRequestWithoutBody, ['delete']),
    head: partial(doRequestWithoutBody, ['head']),
    post: partial(doRequestWithBody, ['post']),
    put: partial(doRequestWithBody, ['put']),
    patch: partial(doRequestWithBody, ['patch']),
    link: partial(doRequestWithoutBody, ['link']),
    unlink: partial(doRequestWithoutBody, ['unlink'])
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
