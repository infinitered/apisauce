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

test('POST has proper data', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.post('/post', MOCK)
  expect(response.status).toBe(200)
  expect(response.data).toEqual({ got: MOCK })
})

test('PATCH has proper data', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.patch('/post', MOCK)
  expect(response.status).toBe(200)
  expect(response.data).toEqual({ got: MOCK })
})

test('PUT has proper data', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.put('/post', MOCK)
  expect(response.status).toBe(200)
  expect(response.data).toEqual({ got: MOCK })
})
