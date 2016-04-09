import http from 'http'
import R from 'ramda'
import RS from 'ramdasauce'

const sendResponse = (res, statusCode, body) => {
  res.writeHead(statusCode)
  res.write(body)
  res.end()
}

const send200 = (res, body) => {
  sendResponse(res, 200, body || '<h1>OK</h1>')
}

export default (port) => {
  const server = http.createServer((req, res) => {
    const url = req.url
    if (url === '/ok') {
      send200(res)
      return
    }
    if (RS.startsWith('/number', url)) {
      const n = R.pipe(R.split('/'), R.last)(url)
      sendResponse(res, n, '')
      return
    }
  })
  server.listen(port, 'localhost')

  return server
}
