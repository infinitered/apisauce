import { create, NONE } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'
import { beforeAll, afterAll, test } from '@jest/globals'

let port
let server = null
beforeAll(async () => {
  port = await getFreePort()
  server = await createServer(port)
})

afterAll(() => {
  server.close()
})

test('GET supports params', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get('/echo', { q: 'hello' })
  expect(response.problem).toBe(NONE)
  expect(response.data).toEqual({ echo: 'hello' })
})

test('POST supports params', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.post('/echo', null, { params: { q: 'hello' } })
  expect(response.problem).toBe(NONE)
  expect(response.data).toEqual({ echo: 'hello' })
})

test('PATCH supports params', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.patch('/echo', null, { params: { q: 'hello' } })
  expect(response.problem).toBe(NONE)
  expect(response.data).toEqual({ echo: 'hello' })
})

test('PUT supports params', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.put('/echo', null, { params: { q: 'hello' } })
  expect(response.problem).toBe(NONE)
  expect(response.data).toEqual({ echo: 'hello' })
})

test('DELETE supports params', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.delete('/echo', { q: 'hello' })
  expect(response.problem).toBe(NONE)
  expect(response.data).toEqual({ echo: 'hello' })
})

test('LINK supports params', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.link('/echo', { q: 'hello' })
  expect(response.problem).toBe(NONE)
  expect(response.data).toEqual({ echo: 'hello' })
})

test('UNLINK supports params', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.unlink('/echo', { q: 'hello' })
  expect(response.problem).toBe(NONE)
  expect(response.data).toEqual({ echo: 'hello' })
})

test('Empty params are supported', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get('/echo', {})
  expect(response.problem).toBe(NONE)
  expect(response.data).toEqual({ echo: '' })
})

test('Null params are supported', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get('/echo', null)
  expect(response.problem).toBe(NONE)
  expect(response.data).toEqual({ echo: '' })
})

test('Undefined params are supported', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get('/echo')
  expect(response.problem).toBe(NONE)
  expect(response.data).toEqual({ echo: '' })
})

test('Null parameters should be null', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get('/echo', { q: null })
  expect(response.problem).toBe(NONE)
  expect(response.data).toEqual({ echo: '' })
})

test('Empty parameters should be empty', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get('/echo', { q: '' })
  expect(response.problem).toBe(NONE)
  expect(response.data).toEqual({ echo: '' })
})
