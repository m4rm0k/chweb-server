const subject = require('./chweb-httpd')
const request = require('supertest')

const Connection = require('>/lib/database/Connection')

describe('bin/chweb-httpd', () => {
  let app, agent, connection
  let originalError

  beforeAll(async () => {
    app = subject.start()

    subject.app.get('/unit-test-error', (req, res) => {
      throw new Error()
    })

    originalError = console.error
    console.error = jest.fn()

    subject.bindErrorHandler(subject.app)
    agent = request.agent(app)
    connection = await Connection.connect()
  })

  afterAll(async () => {
    await app.close()
    await connection.close()
    console.error = originalError
  })

  it('should bind a controller to `/api/v1/client`', async () => {
    const res = await agent.get('/api/v1/client/config')
    expect(res.status).not.toEqual(404)
    expect(res.status).not.toBeNull()
    expect(res.status).not.toBeUndefined()
  })

  it('should bind a controller to `/api/v1/hosts`', async () => {
    const res = await agent.get('/api/v1/hosts')
    expect(res.status).not.toEqual(404)
    expect(res.status).not.toBeNull()
    expect(res.status).not.toBeUndefined()
  })

  it('should bind a controller to `/api/v1/user`', async () => {
    const res = await agent.get('/api/v1/user')
    expect(res.status).not.toEqual(404)
    expect(res.status).not.toBeNull()
    expect(res.status).not.toBeUndefined()
  })

  it('should bind a controller to `/api/v1/rules`', async () => {
    const res = await agent.get('/api/v1/rules')
    expect(res.status).not.toEqual(404)
    expect(res.status).not.toBeNull()
    expect(res.status).not.toBeUndefined()
  })

  it('should bind a controller to `/api/v1/settings', async () => {
    const res = await agent.get('/api/v1/settings')
    expect(res.status).not.toEqual(404)
    expect(res.status).not.toBeNull()
    expect(res.status).not.toBeUndefined()
  })

  it('should bind a controller to `/api/v1/analytics', async () => {
    const res = await agent.get('/api/v1/analytics')
    expect(res.status).not.toEqual(404)
    expect(res.status).not.toBeNull()
    expect(res.status).not.toBeUndefined()
  })

  it('should not send the `X-Powered-By` header', async () => {
    const res = await agent.get('/api/v1/hosts')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('should set the `X-XSS-Protection` header', async () => {
    const res = await agent.get('/api/v1/hosts')
    expect(res.headers['x-xss-protection']).not.toBeUndefined()
    expect(res.headers['x-xss-protection']).not.toBeNull()
  })

  describe('when unhandled errors occurs in a HTTP request', () => {
    it('should return a json object', async () => {
      const res = await agent.get('/unit-test-error')
      expect(res.body).toEqual({
        success: false
      })
    })

    it('should set the status to 500', async () => {
      const res = await agent.get('/unit-test-error')
      expect(res.status).toEqual(500)
    })
  })
})
