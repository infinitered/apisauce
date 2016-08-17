import http from 'http'
import R from 'ramda'
import RS from 'ramdasauce'

const processPost = (request, response, callback) => {
  let queryData = ''
  if (typeof callback !== 'function') return null

  request.on('data', function (data) {
    queryData += data
  })

  request.on('end', function () {
    request.post = JSON.parse(queryData)
    callback()
  })
}

const sendResponse = (res, statusCode, body) => {
  res.writeHead(statusCode)
  res.write(body)
  res.end()
}

const send200 = (res, body) => {
  sendResponse(res, 200, body || '<h1>OK</h1>')
}

export default (port, mockData = {}) => {
  const server = http.createServer((req, res) => {
    const url = req.url
    if (url === '/ok') {
      send200(res)
      return
    }

    if (RS.startsWith('/echo', url)) {
      const echo = R.slice(8, Infinity, url)
      sendResponse(res, 200, JSON.stringify({echo}))
      return
    }

    if (RS.startsWith('/number', url)) {
      const n = R.slice(8, 11, url)
      sendResponse(res, n, JSON.stringify(mockData))
      return
    }

    if (RS.startsWith('/sleep', url)) {
      const wait = R.pipe(R.split('/'), R.last, Number)(url)
      setTimeout(() => { send200(res) }, wait)
      return
    }

    if (url === '/post') {
      processPost(req, res, function () {
        sendResponse(res, 200, JSON.stringify({got: req.post}))
        return
      })
    }
  })
  server.listen(port, 'localhost')

  return server
}
