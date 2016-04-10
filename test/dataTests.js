import test from 'ava'
import {create} from '../lib/apisauce'
import createServer from '../support/server'

const PORT = 9193
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

test('has valid data with a 200', (t) => {
  const x = create(validConfig)
  return x.get('/number/200', {a: 'b'}).then((response) => {
    t.is(response.status, 200)
    t.same(response.data, MOCK)
  })
})

test('has valid data with a 400s', (t) => {
  const x = create(validConfig)
  return x.get('/number/404').then((response) => {
    t.is(response.status, 404)
    t.same(response.data, MOCK)
  })
})

test('has valid data with a 500s', (t) => {
  const x = create(validConfig)
  return x.get('/number/500').then((response) => {
    t.is(response.status, 500)
    t.same(response.data, MOCK)
  })
})
