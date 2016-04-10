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

const VERBS = R.split(',', 'get,post,patch,delete,put,head')
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

  // make the functions for requesting each verb
  const requesters = R.pipe(
    R.map((v) => [v, R.partial(doRequest, [instance, v])]),
    R.fromPairs
  )(VERBS)

  // return our wrapper
  return {
    axios: instance,
    ...requesters
  }
}

/**
  Make the request.
 */
const doRequest = (instance, verb, url, params = {}, data = {}) => {
  const requestConfig = {
    url,
    params,
    method: verb,
    data
  }
  // console.log(requestConfig)
  return instance
    .request(requestConfig)
    .then((response) => {
      const problem = responseToProblem(response)
      const {status, headers, config, data} = response
      return {ok: true, status, headers, config, data, problem}
    })
    .catch((response) => {
      const problem = responseToProblem(response)
      if (response instanceof Error) {
        return {ok: false, status: null, headers: null, config: null, data: null, problem}
      } else {
        const {status, headers, config, data} = response
        return {ok: false, status, headers, config, data, problem}
      }
    })
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
