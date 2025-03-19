import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'

let port
let server = null
beforeAll(async () => {
  port = await getFreePort()
  server = await createServer(port)
})

afterAll(() => {
  server.close()
})

test('supports all verbs', () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  expect(x.get).toBeTruthy()
  expect(x.post).toBeTruthy()
  expect(x.patch).toBeTruthy()
  expect(x.put).toBeTruthy()
  expect(x.head).toBeTruthy()
  expect(x.delete).toBeTruthy()
  expect(x.link).toBeTruthy()
  expect(x.unlink).toBeTruthy()
})

test('can make a get', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get('/ok')
  expect(response.ok).toBeTruthy()
  expect(response.config.method).toBe('get')
})

test('can make a post', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.post('/ok')
  expect(response.ok).toBeTruthy()
  expect(response.config.method).toBe('post')
})

test('can make a patch', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.patch('/ok')
  expect(response.ok).toBeTruthy()
  expect(response.config.method).toBe('patch')
})

test('can make a put', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.put('/ok')
  expect(response.ok).toBeTruthy()
  expect(response.config.method).toBe('put')
})

test('can make a delete', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.delete('/ok')
  expect(response.ok).toBeTruthy()
  expect(response.config.method).toBe('delete')
})

test('can make a head', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.head('/ok')
  expect(response.ok).toBeTruthy()
  expect(response.config.method).toBe('head')
})

test('can make a link', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.link('/ok')
  expect(response.ok).toBeTruthy()
  expect(response.config.method).toBe('link')
})

test('can make a unlink', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.unlink('/ok')
  expect(response.ok).toBeTruthy()
  expect(response.config.method).toBe('unlink')
})
