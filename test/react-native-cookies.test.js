import test from 'ava'
import { create } from '../lib/apisauce'
import createServer from './_server'
import getFreePort from './_getFreePort'

const MOCK = { ok: true }
let port
let server = null

// Minimal helpers that behave like the subset of `set-cookie-parser` used
// in the README example. They are intentionally tiny and only support the
// attributes needed by these tests.
const splitCookiesString = raw => raw.split(/,(?=[^,]+=)/)

const parse = parts => {
  return parts.map(part => {
    const segments = part.split(';').map(x => x.trim()).filter(Boolean)
    const [nameValue, ...attrs] = segments
    const [name, value] = nameValue.split('=')
    const cookie = {
      name,
      value,
      path: undefined,
      sameSite: undefined,
      secure: false,
      httpOnly: false,
      domain: undefined,
      expires: undefined,
      maxAge: undefined,
    }

    attrs.forEach(attr => {
      const lower = attr.toLowerCase()
      if (lower === 'secure') cookie.secure = true
      else if (lower === 'httponly') cookie.httpOnly = true
      else if (lower.startsWith('path=')) cookie.path = attr.slice(5)
      else if (lower.startsWith('samesite=')) cookie.sameSite = attr.slice(9)
      else if (lower.startsWith('domain=')) cookie.domain = attr.slice(7)
      else if (lower.startsWith('max-age=')) cookie.maxAge = Number(attr.slice(8)) || undefined
      else if (lower.startsWith('expires=')) cookie.expires = new Date(attr.slice(8))
    })

    return cookie
  })
}

test.before(async () => {
  port = await getFreePort()
  server = await createServer(port, MOCK)
})

test.after('cleanup', () => {
  server.close()
})

test('manual Cookie header example sends Cookie to the server', async t => {
  const api = create({ baseURL: `http://localhost:${port}` })

  const response = await api.get('/headers', {}, {
    withCredentials: false,
    headers: { Cookie: 'session=abc123' },
  })

  t.is(response.status, 200)
  t.is(response.data.headers.cookie, 'session=abc123')
})

test('Set-Cookie transform example parses and persists cookies', async t => {
  const calls = []
  const CookieManager = {
    set(origin, cookie) {
      calls.push({ origin, cookie })
      return Promise.resolve(true)
    },
  }

  const api = create({ baseURL: 'https://example.com', withCredentials: true })

  // Mirror the README "Reading Set-Cookie from responses" example
  api.addResponseTransform(res => {
    const headers = res.headers || {}
    const raw = headers['set-cookie']
      ?? headers['Set-Cookie']
      ?? Object.entries(headers).find(([k]) => k.toLowerCase() === 'set-cookie')?.[1]
    if (!raw) return

    // RN may provide a string; this handles Expires=... commas correctly
    const parts = Array.isArray(raw) ? raw : splitCookiesString(String(raw))
    const cookies = parse(parts, { map: false })

    // Persist to the native jar (optional). Fire-and-forget to avoid blocking.
    const { url = '/', baseURL = '' } = res.config || {}
    let origin = ''
    try {
      if (baseURL) {
        origin = new URL(url || '', baseURL).origin
      } else if (url) {
        origin = new URL(String(url)).origin
      }
    } catch {
      if (typeof baseURL === 'string') {
        const m = baseURL.match(/^(https?:\/\/[^/]+)/i)
        if (m) origin = m[1]
      }
    }
    if (!origin || !/^https?:\/\//.test(origin)) return
    // Compute a standards-compliant default path for new cookies
    let defaultPath = '/'
    try {
      const reqUrl = baseURL ? new URL(url || '', baseURL) : new URL(String(url))
      const p = reqUrl.pathname || '/'
      defaultPath = p === '/' ? '/' : (p.endsWith('/') ? p : p.replace(/\/[^/]*$/, '/'))
    } catch {}
    Promise.all(
      cookies.map(c => {
        // Normalize attributes
        const domain = c.domain ? c.domain.replace(/^\./, '') : undefined
        const expires = c.expires instanceof Date
          ? c.expires.toISOString()
          : typeof c.maxAge === 'number'
            ? new Date(Date.now() + c.maxAge * 1000).toISOString()
            : undefined

        const normSameSite = c.sameSite
          ? ({ lax: 'Lax', strict: 'Strict', none: 'None' }[String(c.sameSite).toLowerCase()] || undefined)
          : undefined
        const forceSecure = normSameSite === 'None' ? true : !!c.secure

        return CookieManager.set(origin, {
          name: c.name,
          value: c.value,
          ...(domain ? { domain } : {}), // host-only if server omitted Domain
          path: c.path || defaultPath,
          ...(expires ? { expires } : {}),
          ...(normSameSite ? { sameSite: normSameSite } : {}),
          secure: forceSecure,
          httpOnly: !!c.httpOnly,
        })
      }),
    ).catch(() => {
      // prevent unhandled promise rejections
    })
  })

  const raw =
    'session=abc123; Path=/; HttpOnly; Secure; SameSite=None,' +
    'theme=light; Path=/prefs; SameSite=Lax'

  const res = {
    ok: true,
    status: 200,
    data: {},
    headers: {
      'set-cookie': raw,
    },
    config: {
      url: '/login',
      baseURL: 'https://example.com',
    },
  }

  // run the transform manually with our synthetic response
  api.responseTransforms.forEach(fn => fn(res))

  // wait for Promise.all chain to flush
  await Promise.resolve()

  t.is(calls.length, 2)

  t.deepEqual(calls[0].origin, 'https://example.com')
  t.deepEqual(calls[0].cookie, {
    name: 'session',
    value: 'abc123',
    path: '/',
    sameSite: 'None',
    secure: true,
    httpOnly: true,
  })

  t.deepEqual(calls[1].cookie, {
    name: 'theme',
    value: 'light',
    path: '/prefs',
    sameSite: 'Lax',
    secure: false,
    httpOnly: false,
  })
})
