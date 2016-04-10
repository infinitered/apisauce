import test from 'ava'
import {create} from '../lib/apisauce'
import createServer from '../support/server'

const PORT = 9197
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

test('can be used with async/await', async (t) => {
  const x = create(validConfig)
  const response = await x.get('/number/200', {a: 'b'})
  t.is(response.status, 200)
  t.same(response.data, MOCK)
})
