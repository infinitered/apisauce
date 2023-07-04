import { create, TIMEOUT_ERROR } from '../lib/apisauce'
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

test('times out', async () => {
  const x = create({ baseURL: `http://localhost:${port}`, timeout: 100 })
  const response = await x.get('/sleep/150')
  expect(response.ok).toBeFalsy()
  expect(response.problem).toBe(TIMEOUT_ERROR)
})
