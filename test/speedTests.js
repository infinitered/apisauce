import test from 'ava'
import {create} from '../lib/apisauce'
import createServer from '../support/server'

const PORT = 9199
const MOCK = {a: {b: [1, 2, 3]}}
let server = null
test.before((t) => {
  server = createServer(PORT, MOCK)
})

test.after('cleanup', (t) => {
  server.close()
})

const validConfig = {
  baseURL: `http://localhost:${PORT}`
}

test('has a duration node', async (t) => {
  const x = create(validConfig)
  const speed = 150
  const response = await x.get(`/sleep/${speed}`)
  t.is(response.status, 200)
  t.truthy(response.duration)
  t.truthy(response.duration >= 150)
  t.truthy(response.duration <= 1000) // fragile
})
