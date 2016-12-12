
var crypto = require('crypto')
var eccrypto = require('eccrypto')
var {expect} = require('chai')
var {create} = require('../lib/apisauce')
var createServer = require('../support/server').default
var R = require('ramda')

const MOCK = {b: false}

var server
var baseURL = 'http://localhost:8080'

before(done => {
    server = createServer(8080, MOCK)
    done()
})

after(done => {
    server.close()
    done()
})

describe('asyncRequestTransforms', function() {
    
    it('attaches an async request transform', (done) => {
        const api = create({ baseURL: baseURL })
        
        expect(api.addAsyncRequestTransform).to.be.a.function
        expect(api.asyncRequestTransforms).to.be.an.array
        expect(api.asyncRequestTransforms).to.be.empty
        
        api.addAsyncRequestTransform(R.identity)
        expect(api.asyncRequestTransforms).to.not.be.empty
        
        done()
    })

    it('alters the request data', (done) => {
        const x = create({ baseURL: baseURL })

        x.addAsyncRequestTransform(req => {
            return new Promise((resolve, reject) => {
                setImmediate(_ => {
                    req.data.b = 2
                    resolve()
                })
            })
        })

        x.post('/post', MOCK).then(res => {
            expect(res.data.got.b).to.equal(2)
            done()
        }).catch(done)
    })

    it('survives empty PUTs', (done) => {
        const x = create({ baseURL: baseURL })
        let count = 0
        x.addAsyncRequestTransform(() => {
            return new Promise((resolve, reject) => {
                setImmediate(_ => {
                    expect(count).to.equal(0)
                    count++
                    resolve()
                })
            })
        })
        x.put('/post', {}).then(response => {
            expect(response.status).to.equal(200)
            expect(count).to.equal(1)
            done()
        }).catch(done)
    })

    it('fires for gets', (done) => {
        const x = create({ baseURL: baseURL })
        let count = 0
        x.addAsyncRequestTransform(({ data, url, method }) => {
            return new Promise((resolve, reject) => {
                setImmediate(_ => {
                    expect(count).to.equal(0)
                    count++
                    resolve()
                })
            })
        })
        x.get('/number/201').then(response => {
            expect(response.status).to.equal(201)
            expect(count).to.equal(1)
            expect(response.data).to.deep.equal(MOCK)
            done()
        }).catch(done)
    })

    it('url can be changed', done => {
        const x = create({ baseURL: baseURL })
        x.addAsyncRequestTransform(request => {
            return new Promise((resolve, reject) => {
                setImmediate(_ => {
                    request.url = R.replace('/201', '/200', request.url)
                    resolve()
                })
            })
        })
        x.get('/number/201', {x: 1}).then(response => {
            expect(response.status).to.equal(200)
            done()
        }).catch(done)
    })

    it('params can be added, edited, and deleted', done => {
        const x = create({ baseURL: baseURL })
        x.addAsyncRequestTransform(request => {
            return new Promise((resolve, reject) => {
                setImmediate(_ => {
                    request.params.x = 2
                    request.params.y = 1
                    delete request.params.z
                    resolve()
                })
            })
        })
        x.get('/number/200', {x: 1, z: 4}).then(response => {
            expect(response.status).to.equal(200)
            expect(response.config.params.x).to.equal(2)
            expect(response.config.params.y).to.equal(1)
            expect(!response.config.params.z).to.equal(true)
            done()
        }).catch(done)
    })

    it('headers can be created', done => {
        const x = create({ baseURL: baseURL })
        x.addAsyncRequestTransform(request => {
            return new Promise((resolve, reject) => {
                setImmediate(_ => {
                    expect(!request.headers['X-APISAUCE']).to.equal(true)
                    request.headers['X-APISAUCE'] = 'new'
                    resolve()
                })
            })
        })
        x.get('/number/201', {x: 1}).then(response => {
            expect(response.status).to.equal(201)
            expect(response.config.headers['X-APISAUCE']).to.equal('new')
            done()
        }).catch(done)
    })

    it('headers from creation time can be changed', done => {
        const x = create({ baseURL: baseURL, headers: { 'X-APISAUCE': 'hello' } })
        x.addAsyncRequestTransform(request => {
            return new Promise((resolve, reject) => {
                setImmediate(_ => {
                    expect(request.headers['X-APISAUCE']).to.equal('hello')
                    request.headers['X-APISAUCE'] = 'change'
                    resolve()
                })
            })
        })
        x.get('/number/201', {x: 1}).then(response => {
            expect(response.status).to.equal(201)
            expect(response.config.headers['X-APISAUCE']).to.equal('change')
            done()
        }).catch(done)
    })

    it('headers can be deleted', done => {
        const x = create({ baseURL: baseURL, headers: { 'X-APISAUCE': 'omg' } })
        x.addAsyncRequestTransform(request => {
            return new Promise((resolve, reject) => {
                setImmediate(_ => {
                    expect(request.headers['X-APISAUCE']).to.equal('omg')
                    delete request.headers['X-APISAUCE']
                    resolve()
                })
            })
        })
        x.get('/number/201', {x: 1}).then(response => {
            expect(response.status).to.equal(201)
            expect(!response.config.headers['X-APISAUCE']).to.equal(true)
            done()
        }).catch(done)
    })
})
