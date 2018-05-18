import test from 'ava'
import { create, UNKNOWN_ERROR } from '../lib/apisauce'

const impossiblePort = 65536

test('add originalError for UNKNOWN_ERROR', t => {
  const x = create({
    baseURL: `http://localhost:${impossiblePort}`
  })
  return x.get('/').then(response => {
    t.falsy(response.ok)
    t.is(response.problem, UNKNOWN_ERROR)
    t.is(
      response.originalError.message,
      'Port should be > 0 and < 65536. Received 65536.'
    )
  })
})
