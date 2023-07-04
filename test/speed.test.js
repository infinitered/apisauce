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

test('has a duration node', async () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const response = await x.get(`/sleep/150`)
  expect(response.status).toBe(200)
  expect(response.duration).toBeTruthy()
  expect(response.duration >= 150).toBeTruthy()
  // expect(response.duration <= 1000).toBeTruthy() // fragile
})
