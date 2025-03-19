import test from 'ava'
import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'

const MOCK = { a: { b: [1, 2, 3] } }
let port
let server = null
test.before(async t => {
  port = await getFreePort()
  server = await createServer(port, MOCK)
})

test.after.always('cleanup', t => {
  server.close()
})

test('has valid data with a 200', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/number/200', { a: 'b' }).then(response => {
    t.is(response.status, 200)
    t.deepEqual(response.data, MOCK)
  })
})

test('has valid data with a 400s', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/number/404').then(response => {
    t.is(response.status, 404)
    t.deepEqual(response.data, MOCK)
  })
})

test('has valid data with a 500s', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/number/500').then(response => {
    t.is(response.status, 500)
    t.deepEqual(response.data, MOCK)
  })
})

test('Falsy data is preserved', t => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/falsy').then(response => {
    t.is(response.data, false)
  })
})
