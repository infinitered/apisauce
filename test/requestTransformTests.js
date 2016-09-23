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

test('alters the request data', (t) => {
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
  x.addRequestTransform(() => {
    count++
  })
  t.is(count, 0)
  return x.put('/post', {}).then(response => {
    t.is(response.status, 200)
    t.is(count, 1)
  })
})

test('fires for gets', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addRequestTransform(({ data, url, method }) => {
    count++
  })
  t.is(count, 0)
  return x.get('/number/201').then(response => {
    t.is(response.status, 201)
    t.is(count, 1)
    t.deepEqual(response.data, MOCK)
  })
})

test('url can be changed', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addRequestTransform(request => {
    request.url = R.replace('/201', '/200', request.url)
  })
  return x.get('/number/201', {x: 1}).then(response => {
    t.is(response.status, 200)
  })
})

test('params can be added, edited, and deleted', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addRequestTransform(request => {
    request.params.x = 2
    request.params.y = 1
    delete request.params.z
  })
  return x.get('/number/200', {x: 1, z: 4}).then(response => {
    t.is(response.status, 200)
    t.is(response.config.params.x, 2)
    t.is(response.config.params.y, 1)
    t.falsy(response.config.params.z)
  })
})

test('promises can be used for asynchronous transforms', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addRequestTransform(request => {
    new Promise((resolve, reject) => {
      setTimeout(() => {
        request.params.w = 3
        resolve()
      }, 50)
    })
  })
  return x.get('/number/200').then(response => {
    t.is(response.config.params.w, 3)
  })
})

test('headers can be created', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addRequestTransform(request => {
    t.falsy(request.headers['X-APISAUCE'])
    request.headers['X-APISAUCE'] = 'new'
  })
  return x.get('/number/201', {x: 1}).then(response => {
    t.is(response.status, 201)
    t.is(response.config.headers['X-APISAUCE'], 'new')
  })
})

test('headers from creation time can be changed', t => {
  const x = create({ baseURL: `http://localhost:${port}`, headers: { 'X-APISAUCE': 'hello' } })
  x.addRequestTransform(request => {
    t.is(request.headers['X-APISAUCE'], 'hello')
    request.headers['X-APISAUCE'] = 'change'
  })
  return x.get('/number/201', {x: 1}).then(response => {
    t.is(response.status, 201)
    t.is(response.config.headers['X-APISAUCE'], 'change')
  })
})

test('headers can be deleted', t => {
  const x = create({ baseURL: `http://localhost:${port}`, headers: { 'X-APISAUCE': 'omg' } })
  x.addRequestTransform(request => {
    t.is(request.headers['X-APISAUCE'], 'omg')
    delete request.headers['X-APISAUCE']
  })
  return x.get('/number/201', {x: 1}).then(response => {
    t.is(response.status, 201)
    t.falsy(response.config.headers['X-APISAUCE'])
  })
})
