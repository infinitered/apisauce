
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
        resolve(req)
      })
    })
  })
  return x.post('/post', MOCK).then(response => {
    t.is(response.status, 200)
    t.is(count, 1)
    t.is(response.data.got.b, 2)
  })
})

test('transformers should run serially', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let first = false
  let second = false
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        t.is(second, false)
        t.is(first, false)
        first = true
        resolve(req)
      })
    })
  })
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        t.is(first, true)
        t.is(second, false)
        second = true
        resolve(req)
      })
    })
  })
  return x.post('/post', MOCK).then(response => {
    t.is(response.status, 200)
    t.is(first, true)
    t.is(second, true)
  })
})

test('survives empty PUTs', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        count++
        resolve(req)
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
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        count++
        resolve(req)
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
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        req.url = R.replace('/201', '/200', req.url)
        resolve(req)
      })
    })
  })
  return x.get('/number/201', {x: 1}).then(response => {
    t.is(response.status, 200)
  })
})

test('params can be added, edited, and deleted', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        req.params.x = 2
        req.params.y = 1
        delete req.params.z
        resolve(req)
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
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        t.falsy(req.headers['X-APISAUCE'])
        req.headers['X-APISAUCE'] = 'new'
        resolve(req)
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
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        t.is(req.headers['X-APISAUCE'], 'hello')
        req.headers['X-APISAUCE'] = 'change'
        resolve(req)
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
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        t.is(req.headers['X-APISAUCE'], 'omg')
        delete req.headers['X-APISAUCE']
        resolve(req)
      })
    })
  })
  return x.get('/number/201', {x: 1}).then(response => {
    t.is(response.status, 201)
    t.falsy(response.config.headers['X-APISAUCE'])
  })
})