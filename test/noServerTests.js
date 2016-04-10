import test from 'ava'
import {create, CONNECTION_ERROR} from '../lib/apisauce'

const PORT = 40444 // i hope you're not running a server lulz

const validConfig = {
  baseURL: `http://localhost:${PORT}`
}

test('has a response despite no server', (t) => {
  const x = create(validConfig)
  return x.get('/number/200', {a: 'b'}).then((response) => {
    t.is(response.status, null)
    t.is(response.problem, CONNECTION_ERROR)
  })
})
