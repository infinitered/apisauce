
import crypto from 'crypto'
import eccrypto from 'eccrypto'
import test from 'ava'
import {create} from '../lib/apisauce'
import createServer from '../support/server'
import R from 'ramda'
import getFreePort from '../support/getFreePort'

const MOCK = {b: 1}
let port
let server = null

test.before(async t => {
  port = await getFreePort()
  server = createServer(port, MOCK)
})

test.after('cleanup', (t) => {
  server.close()
})

test('attaches an async request transform', (t) => {
  const api = create({ baseURL: `http://localhost:${port}` })
  t.truthy(api.addAsyncRequestTransform)
  t.truthy(api.asyncRequestTransforms)
  t.is(api.asyncRequestTransforms.length, 0)
  api.addAsyncRequestTransform(R.identity)
  t.is(api.asyncRequestTransforms.length, 1)
})

test('alters the request data', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        t.is(count, 0)
        count = 1
        t.is(req.data.b, 1)
        req.data.b = 2
        resolve()
      })
    })
  })
  return x.post('/post', MOCK).then(response => {
    t.is(response.status, 200)
    t.is(count, 1)
    t.is(response.data.got.b, {got: {b: 2}})
  })
})

test('survives empty PUTs', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addAsyncRequestTransform(() => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        count++
        resolve()
      })
    })
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
  x.addAsyncRequestTransform(({ data, url, method }) => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        count++
        resolve()
      })
    })
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
  x.addAsyncRequestTransform(request => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        request.url = R.replace('/201', '/200', request.url)
        resolve()
      })
    })
  })
  return x.get('/number/201', {x: 1}).then(response => {
    t.is(response.status, 200)
  })
})

test('params can be added, edited, and deleted', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addAsyncRequestTransform(request => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        request.params.x = 2
        request.params.y = 1
        delete request.params.z
        resolve()
      })
    })
  })
  return x.get('/number/200', {x: 1, z: 4}).then(response => {
    t.is(response.status, 200)
    t.is(response.config.params.x, 2)
    t.is(response.config.params.y, 1)
    t.falsy(response.config.params.z)
  })
})

test('headers can be created', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addAsyncRequestTransform(request => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        t.falsy(request.headers['X-APISAUCE'])
        request.headers['X-APISAUCE'] = 'new'
        resolve()
      })
    })
  })
  return x.get('/number/201', {x: 1}).then(response => {
    t.is(response.status, 201)
    t.is(response.config.headers['X-APISAUCE'], 'new')
  })
})

test('headers from creation time can be changed', t => {
  const x = create({ baseURL: `http://localhost:${port}`, headers: { 'X-APISAUCE': 'hello' } })
  x.addAsyncRequestTransform(request => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        t.is(request.headers['X-APISAUCE'], 'hello')
        request.headers['X-APISAUCE'] = 'change'
        resolve()
      })
    })
  })
  return x.get('/number/201', {x: 1}).then(response => {
    t.is(response.status, 201)
    t.is(response.config.headers['X-APISAUCE'], 'change')
  })
})

test('headers can be deleted', t => {
  const x = create({ baseURL: `http://localhost:${port}`, headers: { 'X-APISAUCE': 'omg' } })
  x.addAsyncRequestTransform(request => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        t.is(request.headers['X-APISAUCE'], 'omg')
        delete request.headers['X-APISAUCE']
        resolve()
      })
    })
  })
  return x.get('/number/201', {x: 1}).then(response => {
    t.is(response.status, 201)
    t.falsy(response.config.headers['X-APISAUCE'])
  })
})