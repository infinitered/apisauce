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

test('attaches a response transform', () => {
  const api = create({ baseURL: `http://localhost:${port}` })
  expect(api.addResponseTransform).toBeTruthy()
  expect(api.responseTransforms).toBeTruthy()
  expect(api.responseTransforms.length).toBe(0)
  api.addResponseTransform(response => response)
  expect(api.responseTransforms.length).toBe(1)
})

test('alters the response', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addResponseTransform(({ data }) => {
    count++
    data.a = 'hi'
  })
  expect(count).toBe(0)
  const response = await x.get('/number/201')
  expect(response.status).toBe(201)
  expect(count).toBe(1)
  expect(response.data.a).toEqual('hi')
})

test('swap out data on response', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  let count = 0
  x.addResponseTransform(response => {
    count++
    response.status = 222
    response.data = { a: response.data.a.b.reverse() }
  })
  const response = await x.get('/number/201')
  expect(response.status).toBe(222)
  expect(count).toBe(1)
  expect(response.data.a).toEqual([3, 2, 1])
})
