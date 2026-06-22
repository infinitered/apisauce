
import http from 'http'

const processPost = (request, response, callback) => {
  let queryData = ''
  if (typeof callback !== 'function') return null

  request.on('data', function(data) {
    queryData += data
  })

  request.on('end', function() {
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
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const url = req.url
      if (url === '/headers') {
        // Echo request headers for tests that need to assert on outbound headers
        sendResponse(res, 200, JSON.stringify({ headers: req.headers }))
        return
      }

      if (url === '/ok') {
        send200(res)
        return
      }

      if (url.startsWith('/echo')) {
        const echo = url.slice(8)
        sendResponse(res, 200, JSON.stringify({ echo }))
        return
      }

      if (url.startsWith('/number')) {
        const n = url.slice(8, 11)
        sendResponse(res, n, JSON.stringify(mockData))
        return
      }

      if (url.startsWith('/falsy')) {
        sendResponse(res, 200, JSON.stringify(false))
        return
      }

      if (url.startsWith('/sleep')) {
        const wait = Number(url.split('/').pop())
        setTimeout(() => {
          send200(res)
        }, wait)
        return
      }

      if (url === '/post') {
        processPost(req, res, function() {
          sendResponse(res, 200, JSON.stringify({ got: req.post }))
        })
      }
    })
    server.listen(port, '::', () => resolve(server))
  })
}
