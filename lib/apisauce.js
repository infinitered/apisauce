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
  const mergedHeaders = R.merge(DEFAULT_HEADERS, config.headers || {})
  const combinedConfig = R.merge(DEFAULT_CONFIG, R.merge(config, {headers: mergedHeaders}))

  // create the axios instance
  const instance = axios.create(combinedConfig)

  // immediate reset headers because axios kept its own defaults
  instance.defaults.headers = combinedConfig.headers

  const monitors = []
  const addMonitor = (monitor) => {
    monitors.push(monitor)
  }

  // convenience for setting new request headers
  const setHeader = (name, value) => {
    instance.defaults.headers[name] = value
    return instance
  }

  // sets headers in bulk
  const setHeaders = (headers) => {
    const keys = R.keys(headers)
    R.forEach(header => setHeader(header, headers[header]), keys)
    return instance
  }

  // create the base object
  const sauce = {
    axiosInstance: instance,
    monitors,
    addMonitor,
    setHeader,
    setHeaders
  }

  // attach functions for each our HTTP verbs
  sauce.get = R.partial(doRequestWithoutBody, [sauce, 'get'])
  sauce.delete = R.partial(doRequestWithoutBody, [sauce, 'delete'])
  sauce.head = R.partial(doRequestWithoutBody, [sauce, 'head'])
  sauce.post = R.partial(doRequestWithBody, [sauce, 'post'])
  sauce.put = R.partial(doRequestWithBody, [sauce, 'put'])
  sauce.patch = R.partial(doRequestWithBody, [sauce, 'patch'])

  // send it back
  return sauce
}

/**
  Make the request for GET, HEAD, DELETE
 */
const doRequestWithoutBody = (api, method, url, params = {}, axiosConfig = {}) => {
  return doRequest(api, R.merge({url, params, method}, axiosConfig))
}

/**
  Make the request for POST, PUT, PATCH
 */
const doRequestWithBody = (api, method, url, data = null, axiosConfig = {}) => {
  return doRequest(api, R.merge({url, method, data}, axiosConfig))
}

/**
  Make the request with this config!
 */
const doRequest = (api, axiosRequestConfig) => {
  const {axiosInstance} = api
  const startedAt = RS.toNumber(new Date())

  // first convert the axios response, then execute our callback
  const chain = R.pipe(
    R.partial(convertResponse, [startedAt]),
    R.partial(runMonitors, [api])
  )

  // Make the request and execute the identical pipeline for both promise paths.
  return axiosInstance
    .request(axiosRequestConfig)
    .then(chain)
    .catch(chain)
}

/**
  Fires after we convert from axios' response into our response.  Exceptions
  raised for each monitor will be ignored.
 */
const runMonitors = (api, ourResponse) => {
  api.monitors.forEach((fn) => {
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
  const data = response && response.data || null
  const status = response && response.status || null
  const problem = isError ? getProblemFromError(axiosResponse) : getProblemFromStatus(status)

  return {
    duration,
    problem,
    ok: in200s(status),
    status,
    headers: response && response.headers || null,
    config: response && response.config || null,
    data
  }
}

/**
  What's the problem for this response?

  TODO: We're losing some error granularity, but i'm cool with that
  until someone cares.
 */
export const getProblemFromError = (error) => {
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
export const getProblemFromStatus = status => {
  return R.cond([
    [R.isNil, R.always(UNKNOWN_ERROR)],
    [in200s, R.always(NONE)],
    [in400s, R.always(CLIENT_ERROR)],
    [in500s, R.always(SERVER_ERROR)],
    [R.T, R.always(UNKNOWN_ERROR)]
  ])(status)
}
