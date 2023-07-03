import test from 'ava'
import { create, DEFAULT_HEADERS } from '../lib/apisauce'
import axios from 'axios'

const validConfig = {
  baseURL: 'http://localhost:9991',
  headers: { 'X-Testing': 'hello' },
}

test('is a function', t => {
  t.is(typeof create, 'function')
})

test('returns an object when we configure correctly', t => {
  const x = create(validConfig)
  t.truthy(x)
  t.truthy(x.axiosInstance)
})

test('configures axios correctly', t => {
  const apisauce = create(validConfig)
  const { axiosInstance } = apisauce
  t.is(axiosInstance.defaults.timeout, 0)
  t.is(axiosInstance.defaults.baseURL, validConfig.baseURL)
  t.deepEqual(apisauce.headers, Object.assign({}, DEFAULT_HEADERS, validConfig.headers))
})

test('configures axios correctly with passed instance', t => {
  const customAxiosInstance = axios.create({ baseURL: validConfig.baseURL })
  const apisauce = create({ axiosInstance: customAxiosInstance, headers: validConfig.headers })
  const { axiosInstance } = apisauce
  t.is(axiosInstance.defaults.timeout, 0)
  t.is(axiosInstance.defaults.baseURL, validConfig.baseURL)
  t.deepEqual(apisauce.headers, Object.assign({}, DEFAULT_HEADERS, validConfig.headers))
})
