const Connection = require('>/lib/database/Connection')
const Host = require('>/models/Host')
const expressHelper = require('>/test/support/express_helper')
const request = require('supertest')
const subject = require('./middleware')

describe('controllers/host/middleware', () => {
  let app
  let connection
  let apiKey
  let hostId
  let lastHostId

  beforeAll(async () => {
    connection = await Connection.connect()
    app = expressHelper.create()
    app.get('/test', subject.authenticate, (req, res) => {
      lastHostId = res.locals.host.id
      res.status(200).end()
    })

    const host = new Host()
    host.apiKey = '1234-5678'
    host.name = 'Test'
    await host.save()

    apiKey = host.apiKey
    hostId = host.id
  })

  afterAll(async () => {
    await connection.client.close()
  })

  describe('.authenticate', () => {
    describe('when an API key is specified in the query string', () => {
      it('should authenticate as the matching host', async () => {
        const res = await request(app)
          .get('/test')
          .query({ apiKey: apiKey })

        expect(res.status).toBe(200)
        expect(lastHostId).toEqual(hostId)
      })

      describe('if the API key does not match a host', () => {
        it('should return a 401', async () => {
          const res = await request(app)
            .get('/test')
            .query({ apiKey: 'invalid' })

          expect(res.status).toBe(401)
        })
      })
    })

    describe('when an API key is specified in the X-API-Key header', () => {
      it('should authenticate as the matching host', async () => {
        const res = await request(app)
          .get('/test')
          .set('X-API-Key', apiKey)

        expect(res.status).toBe(200)
        expect(lastHostId).toEqual(hostId)
      })

      describe('if the API key does not match a host', () => {
        it('should return a 401', async () => {
          const res = await request(app)
            .get('/test')
            .set('X-API-Key', 'invalid')

          expect(res.status).toBe(401)
        })
      })
    })
  })
})
