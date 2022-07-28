import axios, { AxiosResponse, AxiosError } from 'axios'

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
const toNumber = (value: any): number => {
  // if value is a Date, convert to a number
  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === 'number' || value === null || value === undefined) {
    return value
  }

  return Number(value)
}

/**
 * Given a min and max, determines if the value is included
 * in the range.
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
const isWithin = (min: number, max: number, value: number): boolean => value >= min && value <= max

/**
 * Are we dealing with a promise?
 */
const isPromise = obj =>
  !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'

// the default headers given to axios
export const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

// the default configuration for axios, default headers will also be merged in
const DEFAULT_CONFIG = {
  timeout: 0,
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
const in200s = (n: number): boolean => isWithin(200, 299, n)
const in400s = (n: number): boolean => isWithin(400, 499, n)
const in500s = (n: number): boolean => isWithin(500, 599, n)

/**
 * What's the problem for this axios response?
 */
export const getProblemFromError = error => {
  // first check if the error message is Network Error (set by axios at 0.12) on platforms other than NodeJS.
  if (error.message === 'Network Error') return NETWORK_ERROR
  if (axios.isCancel(error)) return CANCEL_ERROR

  // then check the specific error code
  if (!error.code) return getProblemFromStatus(error.response ? error.response.status : null)
  if (TIMEOUT_ERROR_CODES.includes(error.code)) return TIMEOUT_ERROR
  if (NODEJS_CONNECTION_ERROR_CODES.includes(error.code)) return CONNECTION_ERROR
  return UNKNOWN_ERROR
}

type StatusCodes = undefined | number

/**
 * Given a HTTP status code, return back the appropriate problem enum.
 */
export const getProblemFromStatus = (status: StatusCodes) => {
  if (!status) return UNKNOWN_ERROR
  if (in200s(status)) return NONE
  if (in400s(status)) return CLIENT_ERROR
  if (in500s(status)) return SERVER_ERROR
  return UNKNOWN_ERROR
}

/**
 * Creates a instance of our API using the configuration.
 */
export const create = config => {
  // combine the user's headers with ours
  const headers = { ...DEFAULT_HEADERS, ...(config.headers || {}) }

  let instance
  if (config.axiosInstance) {
    // use passed axios instance
    instance = config.axiosInstance
  } else {
    const configWithoutHeaders = { ...config, headers: undefined }
    const combinedConfig = { ...DEFAULT_CONFIG, ...configWithoutHeaders }
    // create the axios instance
    instance = axios.create(combinedConfig)
  }

  const monitors = []
  const addMonitor = monitor => {
    monitors.push(monitor)
  }

  const requestTransforms = []
  const asyncRequestTransforms = []
  const responseTransforms = []
  const asyncResponseTransforms = []

  const addRequestTransform = transform => requestTransforms.push(transform)
  const addAsyncRequestTransform = transform => asyncRequestTransforms.push(transform)
  const addResponseTransform = transform => responseTransforms.push(transform)
  const addAsyncResponseTransform = transform => asyncResponseTransforms.push(transform)

  // convenience for setting new request headers
  const setHeader = (name, value) => {
    headers[name] = value
    return instance
  }

  // sets headers in bulk
  const setHeaders = headers => {
    Object.keys(headers).forEach(header => setHeader(header, headers[header]))
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

  type RequestsWithoutBody = 'get' | 'head' | 'delete' | 'link' | 'unlink'
  type RequestsWithBody = 'post' | 'put' | 'patch'

  /**
   * Make the request for GET, HEAD, DELETE
   */
  const doRequestWithoutBody = (method: RequestsWithoutBody) => (url: string, params = {}, axiosConfig = {}) => {
    return doRequest({ ...axiosConfig, url, params, method })
  }

  /**
   * Make the request for POST, PUT, PATCH
   */
  const doRequestWithBody = (method: RequestsWithBody) => (url: string, data, axiosConfig = {}) => {
    return doRequest({ ...axiosConfig, url, method, data })
  }

  /**
   * Make the request with this config!
   */
  const doRequest = async axiosRequestConfig => {
    axiosRequestConfig.headers = {
      ...headers,
      ...axiosRequestConfig.headers,
    }

    // add the request transforms
    if (requestTransforms.length > 0) {
      // overwrite our axios request with whatever our object looks like now
      // axiosRequestConfig = doRequestTransforms(requestTransforms, axiosRequestConfig)
      requestTransforms.forEach(transform => transform(axiosRequestConfig))
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
    const startTime = toNumber(new Date())
    const chain = async response => {
      const ourResponse = await convertResponse(startTime, response)
      return runMonitors(ourResponse)
    }

    return instance
      .request(axiosRequestConfig)
      .then(chain)
      .catch(chain)
  }

  /**
   * Fires after we convert from axios' response into our response.  Exceptions
   * raised for each monitor will be ignored.
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
   * Converts an axios response/error into our response.
   */
  const convertResponse = async (startedAt: number, axiosResult: AxiosResponse | AxiosError) => {
    const end: number = toNumber(new Date())
    const duration: number = end - startedAt

    // new in Axios 0.13 -- some data could be buried 1 level now
    const isError = axiosResult instanceof Error || axios.isCancel(axiosResult)
    const axiosResponse = axiosResult as AxiosResponse
    const axiosError = axiosResult as AxiosError
    const response = isError ? axiosError.response : axiosResponse
    const status = (response && response.status) || null
    const problem = isError ? getProblemFromError(axiosResult) : getProblemFromStatus(status)
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
      data,
    }
    if (responseTransforms.length > 0) {
      responseTransforms.forEach(transform => transform(transformedResponse))
    }

    // add the async response transforms
    if (asyncResponseTransforms.length > 0) {
      for (let index = 0; index < asyncResponseTransforms.length; index++) {
        const transform = asyncResponseTransforms[index](transformedResponse)
        if (isPromise(transform)) {
          await transform
        } else {
          await transform(transformedResponse)
        }
      }
    }

    return transformedResponse
  }

  // create the base object
  const sauce = {
    axiosInstance: instance,
    monitors,
    addMonitor,
    requestTransforms,
    asyncRequestTransforms,
    responseTransforms,
    asyncResponseTransforms,
    addRequestTransform,
    addAsyncRequestTransform,
    addResponseTransform,
    addAsyncResponseTransform,
    setHeader,
    setHeaders,
    deleteHeader,
    headers,
    setBaseURL,
    getBaseURL,
    any: doRequest,
    get: doRequestWithoutBody('get'),
    delete: doRequestWithoutBody('delete'),
    head: doRequestWithoutBody('head'),
    post: doRequestWithBody('post'),
    put: doRequestWithBody('put'),
    patch: doRequestWithBody('patch'),
    link: doRequestWithoutBody('link'),
    unlink: doRequestWithoutBody('unlink'),
  }
  // send back the sauce
  return sauce
}

export const { isCancel, CancelToken } = axios

export default {
  DEFAULT_HEADERS,
  NONE,
  CLIENT_ERROR,
  SERVER_ERROR,
  TIMEOUT_ERROR,
  CONNECTION_ERROR,
  NETWORK_ERROR,
  UNKNOWN_ERROR,
  create,
  isCancel,
  CancelToken,
}
