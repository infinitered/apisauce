import axios from 'axios'
import R from 'ramda'

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

const VERBS = R.split(',', 'get,post,patch,delete,put,head')

/**
  Creates a instance of our API using the configuration.
 */
const create = (config) => {
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

const doRequest = (instance, verb, url, p = {}, data = {}) => {
  const requestConfig = {
    url,
    params: p,
    method: verb,
    data
  }
  // console.log(requestConfig)
  return instance
    .request(requestConfig)
    .then((response) => {
      const {status, headers, config, data} = response
      return {ok: true, status, headers, config, data}
    })
    .catch((response) => {
      if (response instanceof Error) {
        return {ok: false, error: response}
      } else {
        const {status, headers, config, data} = response
        return {ok: false, status, headers, config, data}
      }
    })
}

export default {
  create
}
