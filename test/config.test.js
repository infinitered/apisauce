import { create, DEFAULT_HEADERS } from '../lib/apisauce'
import axios from 'axios'
import { expect } from '@jest/globals'

const validConfig = {
  baseURL: 'http://localhost:9991',
  headers: { 'X-Testing': 'hello' },
}

test('is a function', () => {
  expect(typeof create).toBe('function')
})

test('returns an object when we configure correctly', () => {
  const x = create(validConfig)
  expect(x).toBeTruthy()
  expect(x.axiosInstance).toBeTruthy()
})

test('configures axios correctly', () => {
  const apisauce = create(validConfig)
  const { axiosInstance } = apisauce
  expect(axiosInstance.defaults.timeout).toBe(0)
  expect(axiosInstance.defaults.baseURL).toBe(validConfig.baseURL)
  expect(apisauce.headers).toEqual(Object.assign({}, DEFAULT_HEADERS, validConfig.headers))
})

test('configures axios correctly with passed instance', () => {
  const customAxiosInstance = axios.create({ baseURL: validConfig.baseURL })
  const apisauce = create({ axiosInstance: customAxiosInstance, headers: validConfig.headers })
  const { axiosInstance } = apisauce
  expect(axiosInstance.defaults.timeout).toBe(0)
  expect(axiosInstance.defaults.baseURL).toBe(validConfig.baseURL)
  expect(apisauce.headers).toEqual(Object.assign({}, DEFAULT_HEADERS, validConfig.headers))
})
