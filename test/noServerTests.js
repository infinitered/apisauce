import test from 'ava'
import lib from '../lib/apisauce'

const PORT = 40444 // i hope you're not running a server lulz

const validConfig = {
  baseURL: `http://localhost:${PORT}`
}

test('has a response despite no server', (t) => {
  const x = lib.create(validConfig)
  return x.get('/number/200', {a: 'b'}).then((response) => {
    console.log(response)
    t.is(response.status, 200)
  })
})
