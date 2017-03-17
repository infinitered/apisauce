import test from 'ava'
import { create } from '../lib/apisauce'
import createServer from '../support/server'
import getFreePort from '../support/getFreePort'

const MOCK = { a: { b: [1, 2, 3] } }
let port
let server = null
test.before(async t => {
  port = await getFreePort()
  server = createServer(port, MOCK)
})

test.after('cleanup', t => {
  server.close()
})

test('changes the headers', async t => {
  const api = create({
    baseURL: `http://localhost:${port}`,
    headers: { 'X-Testing': 'hello' }
  })
  const response1 = await api.get('/number/200')
  t.deepEqual(response1.data, MOCK)

  // change the url
  const nextUrl = `http://127.0.0.1:${port}`
  api.setBaseURL(nextUrl)
  t.is(api.getBaseURL(), nextUrl)
  const response2 = await api.get('/number/200')
  t.deepEqual(response2.data, MOCK)

  // now close the server
  server.close()

  // and try connecting back to the original one
  api.setBaseURL(`http://localhost:${port}`)
  const response3 = await api.get('/number/200')
  t.is(response3.problem, 'CONNECTION_ERROR')
})
