import net from 'net'

export default function getFreePort (cb) {
  return new Promise(resolve => {
    const server = net.createServer()
    server.listen(() => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
  })
}
