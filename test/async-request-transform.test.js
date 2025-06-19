import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'

const MOCK = { b: 1 }
let port
let server = null

/**
 * Wait before firing.
 *
 * @param {Number} time The number of milliseconds to wait.
 * @return {Promise}
 */
const delay = time =>
  new Promise(resolve => {
    setTimeout(resolve, time)
  })

beforeAll(async () => {
  port = await getFreePort()
  server = await createServer(port, MOCK)
})

afterAll(() => {
  server.close()
})

test('attaches an async request transform', () => {
  const api = create({ baseURL: `http://localhost:${port}` })
  expect(api.addAsyncRequestTransform).toBeTruthy()
  expect(api.asyncRequestTransforms).toBeTruthy()
  expect(api.asyncRequestTransforms.length).toBe(0)
  api.addAsyncRequestTransform(request => request)
  expect(api.asyncRequestTransforms.length).toBe(1)
})

test('alters the request data', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        expect(count).toBe(0)
        count = 1
        expect(req.data.b).toBe(1)
        req.data.b = 2
        resolve(req)
      })
    })
  })
  const response = await x.post('/post', MOCK)
  expect(response.status).toBe(200)
  expect(count).toBe(1)
  expect(response.data.got.b).toBe(2)
})

test('serial async', async () => {
  const api = create({ baseURL: `http://localhost:${port}` })
  let fired = false
  api.addAsyncRequestTransform(request => async () => {
    await delay(300)
    request.url = '/number/201'
    fired = true
  })
  const response = await api.get('/number/200')
  expect(response.ok).toBe(true)
  expect(response.status).toBe(201)
  expect(fired).toBe(true)
})

test('transformers should run serially', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let first = false
  let second = false
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        expect(second).toBe(false)
        expect(first).toBe(false)
        first = true
        resolve()
      })
    })
  })
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        expect(first).toBe(true)
        expect(second).toBe(false)
        second = true
        resolve()
      })
    })
  })
  const response = await x.post('/post', MOCK)
  expect(response.status).toBe(200)
  expect(first).toBe(true)
  expect(second).toBe(true)
})

test('survives empty PUTs', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        count++
        resolve()
      })
    })
  })
  expect(count).toBe(0)
  const response = await x.put('/post', {})
  expect(response.status).toBe(200)
  expect(count).toBe(1)
})

test('fires for gets', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        count++
        resolve()
      })
    })
  })
  expect(count).toBe(0)
  const response = await x.get('/number/201')
  expect(response.status).toBe(201)
  expect(count).toBe(1)
  expect(response.data).toEqual(MOCK)
})

test('url can be changed', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        req.url = req.url.replace('/201', '/200')
        resolve()
      })
    })
  })
  const response = await x.get('/number/201', { x: 1 })
  expect(response.status).toBe(200)
})

test('params can be added, edited, and deleted', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        req.params.x = 2
        req.params.y = 1
        delete req.params.z
        resolve()
      })
    })
  })
  const response = await x.get('/number/200', { x: 1, z: 4 })
  expect(response.status).toBe(200)
  expect(response.config.params.x).toBe(2)
  expect(response.config.params.y).toBe(1)
  expect(response.config.params.z).toBeFalsy()
})

test('headers can be created', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        expect(req.headers['X-APISAUCE']).toBeFalsy()
        req.headers['X-APISAUCE'] = 'new'
        resolve()
      })
    })
  })
  const response = await x.get('/number/201', { x: 1 })
  expect(response.status).toBe(201)
  expect(response.config.headers['X-APISAUCE']).toBe('new')
})

test('headers from creation time can be changed', async () => {
  const x = create({
    baseURL: `http://localhost:${port}`,
    headers: { 'X-APISAUCE': 'hello' },
  })
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        expect(req.headers['X-APISAUCE']).toBe('hello')
        req.headers['X-APISAUCE'] = 'change'
        resolve()
      })
    })
  })
  const response = await x.get('/number/201', { x: 1 })
  expect(response.status).toBe(201)
  expect(response.config.headers['X-APISAUCE']).toBe('change')
})

test('headers can be deleted', async () => {
  const x = create({
    baseURL: `http://localhost:${port}`,
    headers: { 'X-APISAUCE': 'omg' },
  })
  x.addAsyncRequestTransform(req => {
    return new Promise((resolve, reject) => {
      setImmediate(_ => {
        expect(req.headers['X-APISAUCE']).toBe('omg')
        delete req.headers['X-APISAUCE']
        resolve()
      })
    })
  })
  const response = await x.get('/number/201', { x: 1 })
  expect(response.status).toBe(201)
  expect(response.config.headers['X-APISAUCE']).toBe(undefined)
})
