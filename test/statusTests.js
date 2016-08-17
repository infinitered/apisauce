import test from 'ava'
import {create, NONE, CLIENT_ERROR, SERVER_ERROR} from '../lib/apisauce'
import createServer from '../support/server'
import getFreePort from '../support/getFreePort'

let port
let server = null
test.before(async t => {
  port = await getFreePort()
  server = createServer(port)
})

test.after('cleanup', (t) => {
  server.close()
})

test('reads the status code for 200s', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/number/201').then((response) => {
    t.is(response.status, 201)
    t.is(response.problem, NONE)
  })
})

test('reads the status code for 400s', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/number/401').then((response) => {
    t.is(response.status, 401)
    t.is(response.problem, CLIENT_ERROR)
  })
})

test('reads the status code for 500s', (t) => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/number/501').then((response) => {
    t.is(response.status, 501)
    t.is(response.problem, SERVER_ERROR)
  })
})
