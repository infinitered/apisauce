import test from 'ava'
import {create} from '../lib/apisauce'
import createServer from '../support/server'
import R from 'ramda'
import getFreePort from '../support/getFreePort'

const MOCK = {a: {b: [1, 2, 3]}}
let port
let server = null
test.before(async t => {
  port = await getFreePort()
  server = createServer(port, MOCK)
})

test.after('cleanup', (t) => {
  server.close()
})

test('attaches a request transform', (t) => {
  const api = create({ baseURL: `http://localhost:${port}` })
  t.truthy(api.addRequestTransform)
  t.truthy(api.requestTransforms)
  t.is(api.requestTransforms.length, 0)
  api.addRequestTransform(R.identity)
  t.is(api.requestTransforms.length, 1)
})

test('alters the request', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addRequestTransform(({ data, url, method }) => {
    data.a = 'hi'
    count++
  })
  t.is(count, 0)
  return x.post('/post', MOCK).then(response => {
    t.is(response.status, 200)
    t.is(count, 1)
    t.deepEqual(response.data, {got: {a: 'hi'}})
  })
})

test('survives empty PUTs', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addRequestTransform(({ data, url, method }) => {
    count++
  })
  t.is(count, 0)
  return x.post('/puts', null).then(response => {
    t.is(response.status, 200)
    t.is(count, 1)
    t.deepEqual(response.data, {got: {a: 'hi'}})
  })
})

test('alters nothing for gets', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addRequestTransform(({ data, url, method }) => {
    data.a = 'hi'
    count++
  })
  t.is(count, 0)
  return x.get('/number/201').then(response => {
    t.is(response.status, 201)
    t.is(count, 0)
    t.deepEqual(response.data, MOCK)
  })
})
