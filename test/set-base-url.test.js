import { beforeAll, afterAll, test } from '@jest/globals'
import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'

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

test('changes the headers', async () => {
  const api = create({
    baseURL: `http://localhost:${port}`,
    headers: { 'X-Testing': 'hello' },
  })
  const response1 = await api.get('/number/200')
  expect(response1.data).toEqual(MOCK)

  // change the url
  const nextUrl = `http://127.0.0.1:${port}`
  api.setBaseURL(nextUrl)
  expect(api.getBaseURL()).toBe(nextUrl)
  const response2 = await api.get('/number/200')
  expect(response2.data).toEqual(MOCK)

  // now close the server
  server.close()

  // and try connecting back to the original one
  api.setBaseURL(`http://localhost:${port}`)
  const response3 = await api.get('/number/200')
  expect(response3.problem).toBe('CONNECTION_ERROR')
})
