import test from 'ava'
import { create } from '../lib/apisauce'
import R from 'ramda'
import createServer from './_server'
import getFreePort from './_getFreePort'

const MOCK = { a: { b: [1, 2, 3] } }
let port
let server = null
test.before(async t => {
  port = await getFreePort()
  server = await createServer(port, MOCK)
})

test.after('cleanup', t => {
  server.close()
})

test('attaches a monitor', t => {
  const api = create({ baseURL: `http://localhost:${port}` })
  t.truthy(api.addMonitor)
  t.truthy(api.monitors)
  t.is(api.monitors.length, 0)
  api.addMonitor(R.identity)
  t.is(api.monitors.length, 1)
})

test('fires our monitor function', t => {
  let a = 0
  let b = 0
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addMonitor(response => {
    a += 1
  })
  x.addMonitor(response => {
    b = response.status
  })
  t.is(a, 0)
  return x.get('/number/201').then(response => {
    t.is(response.status, 201)
    t.is(a, 1)
    t.is(b, 201)
  })
})

test('ignores exceptions raised inside monitors', t => {
  let a = 0
  let b = 0
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addMonitor(response => {
    a += 1
  })
  x.addMonitor(response => {
    this.recklessDisregardForAllThingsJust(true)
  })
  x.addMonitor(response => {
    b = response.status
  })
  t.is(a, 0)
  return x.get('/number/201').then(response => {
    t.is(response.status, 201)
    t.is(a, 1)
    t.is(b, 201)
  })
})
