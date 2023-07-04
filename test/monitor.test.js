import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'
import { beforeAll, afterAll, expect, test } from '@jest/globals'

const MOCK = { a: { b: [1, 2, 3] } }
let port
let server = null
beforeAll(async () => {
  port = await getFreePort()
  server = await createServer(port, MOCK)
})

afterAll(() => {
  server.close()
})

test('attaches a monitor', () => {
  const api = create({ baseURL: `http://localhost:${port}` })
  expect(api.addMonitor).toBeTruthy()
  expect(api.monitors).toBeTruthy()
  expect(api.monitors.length).toBe(0)
  api.addMonitor(x => x)
  expect(api.monitors.length).toBe(1)
})

test('fires our monitor function', async () => {
  let a = 0
  let b = 0
  const x = create({ baseURL: `http://localhost:${port}` })
  x.addMonitor(response => {
    a += 1
  })
  x.addMonitor(response => {
    b = response.status
  })
  expect(a).toBe(0)
  const response = await x.get('/number/201')
  expect(response.status).toBe(201)
  expect(a).toBe(1)
  expect(b).toBe(201)
})

test('ignores exceptions raised inside monitors', async () => {
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
  expect(a).toBe(0)
  const response = await x.get('/number/201')
  expect(response.status).toBe(201)
  expect(a).toBe(1)
  expect(b).toBe(201)
})
