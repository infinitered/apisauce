import axios from 'axios'
import R from 'ramda'
import RS from 'ramdasauce'

// check for an invalid config
const isInvalidConfig = R.anyPass([
  R.isNil,
  R.isEmpty,
  R.complement(R.has('baseURL')),
  R.complement(R.propIs(String, 'baseURL')),
  R.propSatisfies(R.isEmpty, 'baseURL')
])

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

const TIMEOUT_ERROR_CODES = ['ECONNABORTED']
const NODEJS_CONNECTION_ERROR_CODES = ['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET']
const in200s = RS.isWithin(200, 299)
const in400s = RS.isWithin(400, 499)
const in500s = RS.isWithin(500, 599)

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
  const responseTransforms = []

  const addRequestTransform = transform => requestTransforms.push(transform)
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
  const doRequest = (axiosRequestConfig) => {
    const startedAt = RS.toNumber(new Date())

    axiosRequestConfig.headers = { ...headers, ...axiosRequestConfig.headers }
    // add the request transforms
    if (requestTransforms.length > 0) {
      // create an object to feed through the request transforms
      const request = R.pick(['url', 'method', 'data', 'headers', 'params'], axiosRequestConfig)

      // go go go!
      R.forEach(transform => transform(request), requestTransforms)

      // overwrite our axios request with whatever our object looks like now
      axiosRequestConfig = R.merge(axiosRequestConfig, request)
    }

    // first convert the axios response, then execute our callback
    const chain = R.pipe(
      R.partial(convertResponse, [startedAt]),
      runMonitors
    )

    // Make the request and execute the identical pipeline for both promise paths.
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
    monitors.forEach((fn) => {
      try {
        fn(ourResponse)
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
    const end = RS.toNumber(new Date())
    const duration = (end - startedAt)

    // new in Axios 0.13 -- some data could be buried 1 level now
    const isError = axiosResponse instanceof Error
    const response = isError ? axiosResponse.response : axiosResponse
    const status = response && response.status || null
    const problem = isError ? getProblemFromError(axiosResponse) : getProblemFromStatus(status)
    const ok = in200s(status)
    const config = axiosResponse.config || null
    const headers = response && response.headers || null
    let data = response && response.data || null

    // give an opportunity for anything to the response transforms to change stuff along the way
    if (responseTransforms.length > 0) {
      R.forEach(transform => {
        transform({ duration, problem, ok, status, headers, config, data })
      }, responseTransforms)
    }

    return { duration, problem, ok, status, headers, config, data }
  }

  /**
    What's the problem for this response?

    TODO: We're losing some error granularity, but i'm cool with that
    until someone cares.
   */
  const getProblemFromError = (error) => {
    // first check if the error message is Network Error (set by axios at 0.12) on platforms other than NodeJS.
    if (error.message === 'Network Error') return NETWORK_ERROR
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
    responseTransforms,
    addRequestTransform,
    addResponseTransform,
    setHeader,
    setHeaders,
    headers,
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
