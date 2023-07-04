import { create, CONNECTION_ERROR } from '../lib/apisauce'
import getFreePort from './_getFreePort'
import { beforeAll, test } from '@jest/globals'

let port
beforeAll(async () => {
  port = await getFreePort()
})

test('has a response despite no server', () => {
  const x = create({ baseURL: `http://localhost:${port}` })
  return x.get('/number/200', { a: 'b' }).then(response => {
    expect(response.status).toBe(null)
    expect(response.problem).toBe(CONNECTION_ERROR)
  })
})
