import test from 'ava'
import {create} from '../lib/apisauce'
import createServer from '../support/server'
import R from 'ramda'

const PORT = 9196
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

test('attaches a monitor', (t) => {
  const api = create(validConfig)
  t.ok(api.addMonitor)
  t.ok(api.monitors)
  t.is(api.monitors.length, 0)
  api.addMonitor(R.identity)
  t.is(api.monitors.length, 1)
})

test('fires our monitor function', (t) => {
  let a = 0
  let b = 0
  const x = create(validConfig)
  x.addMonitor((response) => { a += 1 })
  x.addMonitor((response) => { b = response.status })
  t.is(a, 0)
  return x.get('/number/201').then((response) => {
    t.is(response.status, 201)
    t.is(a, 1)
    t.is(b, 201)
  })
})

test('ignores exceptions raised inside monitors', (t) => {
  let a = 0
  let b = 0
  const x = create(validConfig)
  x.addMonitor((response) => { a += 1 })
  x.addMonitor((response) => { this.recklessDisregardForAllThingsJust(true) })
  x.addMonitor((response) => { b = response.status })
  t.is(a, 0)
  return x.get('/number/201').then((response) => {
    t.is(response.status, 201)
    t.is(a, 1)
    t.is(b, 201)
  })
})
