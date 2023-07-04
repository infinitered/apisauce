import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'
import { beforeAll, afterAll, expect, test } from '@jest/globals'

const MOCK = { a: { b: [1, 2, 3] } }
let port
let server = null
beforeAll(async () => {
  port = await getFreePort()
  server = await createServer(port, MOCK)
})

afterAll(() => {
  server.close()
})

test('attaches a request transform', () => {
  const api = create({ baseURL: `http://localhost:${port}` })
  expect(api.addRequestTransform).toBeTruthy()
  expect(api.requestTransforms).toBeTruthy()
  expect(api.requestTransforms.length).toBe(0)
  api.addRequestTransform(request => request)
  expect(api.requestTransforms.length).toBe(1)
})

test('alters the request data', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addRequestTransform(({ data, url, method }) => {
    data.a = 'hi'
    count++
  })
  expect(count).toBe(0)
  const response = await x.post('/post', MOCK)
  expect(response.status).toBe(200)
  expect(count).toBe(1)
  expect(response.data).toEqual({ got: { a: 'hi' } })
})

test('survives empty PUTs', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addRequestTransform(() => {
    count++
  })
  expect(count).toBe(0)
  const response = await x.put('/post', {})
  expect(response.status).toBe(200)
  expect(count).toBe(1)
})

test('fires for gets', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addRequestTransform(({ data, url, method }) => {
    count++
  })
  expect(count).toBe(0)
  const response = await x.get('/number/201')
  expect(response.status).toBe(201)
  expect(count).toBe(1)
  expect(response.data).toEqual(MOCK)
})

test('url can be changed', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addRequestTransform(request => {
    request.url = request.url.replace('/201', '/200')
  })
  const response = await x.get('/number/201', { x: 1 })
  expect(response.status).toBe(200)
})

test('params can be added, edited, and deleted', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addRequestTransform(request => {
    request.params.x = 2
    request.params.y = 1
    delete request.params.z
  })
  const response = await x.get('/number/200', { x: 1, z: 4 })
  expect(response.status).toBe(200)
  expect(response.config.params.x).toBe(2)
  expect(response.config.params.y).toBe(1)
  expect(response.config.params.z).toBeFalsy()
})

test('headers can be created', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addRequestTransform(request => {
    expect(request.headers['X-APISAUCE']).toBeFalsy()
    request.headers['X-APISAUCE'] = 'new'
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
  x.addRequestTransform(request => {
    expect(request.headers['X-APISAUCE']).toBe('hello')
    request.headers['X-APISAUCE'] = 'change'
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
  x.addRequestTransform(request => {
    expect(request.headers['X-APISAUCE']).toBe('omg')
    delete request.headers['X-APISAUCE']
  })
  const response = await x.get('/number/201', { x: 1 })
  expect(response.status).toBe(201)
  expect(response.config.headers['X-APISAUCE']).toBeFalsy()
})
