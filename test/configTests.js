import test from 'ava'
import {create} from '../lib/apisauce'

const validConfig = {
  baseURL: 'http://localhost:9991',
  headers: {'X-Testing': 'hello'}
}

test('is a function', (t) => {
  t.is(typeof create, 'function')
})

test('config must be an object and have a baseURL', (t) => {
  t.throws(() => create())
  t.throws(() => create(null))
  t.throws(() => create(2))
  t.throws(() => create([]))
})

test('config must have a valid baseURL', (t) => {
  t.throws(() => create({}))
  t.throws(() => create({baseURL: null}))
  t.throws(() => create({baseURL: ''}))
})

test('returns an object when we configure correctly', (t) => {
  const x = create(validConfig)
  t.ok(x)
  t.ok(x.axios)
})

test('configures axios correctly', (t) => {
  const axios = create(validConfig).axios
  t.is(axios.defaults.timeout, 0)
  t.is(axios.defaults.baseURL, validConfig.baseURL)
  t.same(axios.defaults.headers, validConfig.headers)
})
