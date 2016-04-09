import test from 'ava'
import lib from '../lib/apisauce'

const validConfig = {
  baseURL: 'http://localhost:9991',
  headers: {'X-Testing': 'hello'}
}

test('is a function', (t) => {
  t.is(typeof lib.create, 'function')
})

test('config must be an object and have a baseURL', (t) => {
  t.throws(() => lib.create())
  t.throws(() => lib.create(null))
  t.throws(() => lib.create(2))
  t.throws(() => lib.create([]))
})

test('config must have a valid baseURL', (t) => {
  t.throws(() => lib.create({}))
  t.throws(() => lib.create({baseURL: null}))
  t.throws(() => lib.create({baseURL: ''}))
})

test('returns an object when we configure correctly', (t) => {
  const x = lib.create(validConfig)
  t.ok(x)
  t.ok(x.axios)
})

test('configures axios correctly', (t) => {
  const axios = lib.create(validConfig).axios
  t.is(axios.defaults.timeout, 0)
  t.is(axios.defaults.baseURL, validConfig.baseURL)
  t.same(axios.defaults.headers, validConfig.headers)
})
