import test from 'ava'
import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'

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

test('has a duration node', async t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  const speed = 150
  const response = await x.get(`/sleep/${speed}`)
  t.is(response.status, 200)
  t.truthy(response.duration)
  t.truthy(response.duration >= 150)
  t.truthy(response.duration <= 1000) // fragile
})
