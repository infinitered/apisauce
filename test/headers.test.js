import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'
import { beforeAll, afterAll, test } from '@jest/globals'

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

test('jumps the wire with the right headers', async () => {
  const api = create({
    baseURL: `http://localhost:${port}`,
    headers: { 'X-Testing': 'hello' },
  })
  api.setHeaders({ 'X-Testing': 'foo', steve: 'hey' })
  const response = await api.get('/number/200', { a: 'b' })
  expect(response.config.headers['X-Testing']).toBe('foo')
  expect(response.config.headers['steve']).toBe('hey')

  // then change one of them
  api.setHeader('steve', 'thx')
  const response2 = await api.get('/number/200', {})
  expect(response2.config.headers['steve']).toBe('thx')

  // then remove one of them
  api.deleteHeader('steve')
  const response3 = await api.get('/number/200', {})
  expect(response3.config.headers['steve']).toBeUndefined()
})
