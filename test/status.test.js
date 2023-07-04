import { create, NONE, CLIENT_ERROR, SERVER_ERROR } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'
import { beforeAll, afterAll, test } from '@jest/globals'

let port
let server = null
beforeAll(async () => {
  port = await getFreePort()
  server = await createServer(port)
})

afterAll(() => {
  server.close()
})

test('reads the status code for 200s', () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/number/201').then(response => {
    expect(response.status).toBe(201)
    expect(response.problem).toBe(NONE)
  })
})

test('reads the status code for 400s', () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/number/401').then(response => {
    expect(response.status).toBe(401)
    expect(response.problem).toBe(CLIENT_ERROR)
  })
})

test('reads the status code for 500s', () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/number/501').then(response => {
    expect(response.status).toBe(501)
    expect(response.problem).toBe(SERVER_ERROR)
  })
})
