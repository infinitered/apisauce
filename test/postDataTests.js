import test from 'ava'
import {create} from '../lib/apisauce'
import createServer from '../support/server'

const PORT = 9195
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

test('POST has proper data', (t) => {
  const x = create(validConfig)
  return x.post('/post', null, MOCK).then((response) => {
    t.is(response.status, 200)
    t.same(response.data, {got: MOCK})
  })
})

test('PATCH has proper data', (t) => {
  const x = create(validConfig)
  return x.patch('/post', null, MOCK).then((response) => {
    t.is(response.status, 200)
    t.same(response.data, {got: MOCK})
  })
})

test('PUT has proper data', (t) => {
  const x = create(validConfig)
  return x.put('/post', null, MOCK).then((response) => {
    t.is(response.status, 200)
    t.same(response.data, {got: MOCK})
  })
})
