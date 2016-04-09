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

  const makeRequest = (verb) =>
     (url) => instance[verb](url)
       .then((response) => {
         const {status, headers, config} = response
         return {ok: true, status, headers, config}
       })
       .catch((response) => {
         const {status, headers, config} = response
         return {ok: false, status, headers, config}
       })

  // return our wrapper
  return {
    axios: instance,
    get: makeRequest('get'),
    post: makeRequest('post'),
    patch: makeRequest('patch'),
    delete: makeRequest('delete'),
    put: makeRequest('put'),
    head: makeRequest('head')
  }
}

export default {
  create
}
