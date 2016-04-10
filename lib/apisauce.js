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

// the default configuration for axios
const DEFAULT_CONFIG = {
  timeout: 0,
  headers: {}
}

export const NONE = null
export const CLIENT_ERROR = 'CLIENT_ERROR'
export const SERVER_ERROR = 'SERVER_ERROR'
export const TIMEOUT_ERROR = 'TIMEOUT_ERROR'
export const CONNECTION_ERROR = 'CONNECTION_ERROR'
export const NETWORK_ERROR = 'NETWORK_ERROR'
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR'

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
  const combinedConfig = R.merge(DEFAULT_CONFIG, config)

  // create the axios instance
  const instance = axios.create(combinedConfig)
  const monitors = []
  const addMonitor = (monitor) => {
    monitors.push(monitor)
  }

  // create the base object
  const sauce = {
    axiosInstance: instance,
    monitors,
    addMonitor
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

  // first convert the axios response, then execute our callback
  const chain = R.pipe(
    convertResponse,
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
const convertResponse = (axiosResponse) => {
  return {
    problem: responseToProblem(axiosResponse),
    ok: R.pipe(R.propOr(0, 'status'), in200s)(axiosResponse),
    status: axiosResponse.status || null,
    headers: axiosResponse.headers || null,
    config: axiosResponse.config || null,
    data: axiosResponse.data || null
  }
}

/**
  What's the problem for this response?

  TODO: We're losing some error granularity, but i'm cool with that
  until someone cares.
 */
export const responseToProblem = (response) => {
  if (response instanceof Error) {
    const known = R.contains(response.code, NODEJS_CONNECTION_ERROR_CODES)
    return known ? CONNECTION_ERROR : UNKNOWN_ERROR
  }
  if (R.isNil(response) || !R.has('status')) return UNKNOWN_ERROR
  return R.cond([
    [in200s, R.always(NONE)],
    [in400s, R.always(CLIENT_ERROR)],
    [in500s, R.always(SERVER_ERROR)],
    [R.T, R.always(UNKNOWN_ERROR)]
  ])(response.status || 0)
}

module.exports = {
  responseToProblem,
  create,
  NONE,
  CLIENT_ERROR,
  SERVER_ERROR,
  TIMEOUT_ERROR,
  CONNECTION_ERROR,
  NETWORK_ERROR,
  UNKNOWN_ERROR
}
