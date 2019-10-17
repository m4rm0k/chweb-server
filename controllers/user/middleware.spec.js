const expressHelper = require('>/test/support/express_helper')
const request = require('supertest')
const subject = require('./middleware')

const Connection = require('>/lib/database/Connection')
const Config = require('>/lib/config')
const User = require('>/models/User')

describe('controllers/user/middleware', () => {
  let app
  let apiKey
  let connection
  let lastUserId
  let userId

  beforeAll(async () => {
    connection = await Connection.connect()
    await global.removeAllMongoDocs()

    app = expressHelper.create()
    app.get('/test', subject.authenticate, (req, res) => {
      lastUserId = res.locals.user.id
      res.status(200).end()
    })

    const user = new User()
    user.apiKey = '1234-5678'
    user.username = 'test'
    await user.save()

    apiKey = user.apiKey
    userId = user.id
  })

  afterAll(async () => {
    await global.removeAllMongoDocs()
    await connection.close()
  })

  describe('.authenticate', () => {
    describe('when an API key is specified in the query string', () => {
      it('should authenticate as the matching user', async () => {
        const res = await request(app)
          .get('/test')
          .query({ apiKey: apiKey })

        expect(res.status).toBe(200)
        expect(lastUserId).toEqual(userId)
      })

      describe('if the API key does not match a user', () => {
        it('should return a 401', async () => {
          const res = await request(app)
            .get('/test')
            .query({ apiKey: 'invalid' })

          expect(res.status).toBe(401)
        })
      })
    })

    describe('when an API key is specified in the X-API-Key header', () => {
      it('should authenticate as the matching user', async () => {
        const res = await request(app)
          .get('/test')
          .set('X-API-Key', apiKey)

        expect(res.status).toBe(200)
        expect(lastUserId).toEqual(userId)
      })

      describe('if the API key does not match a user', () => {
        it('should return a 401', async () => {
          const res = await request(app)
            .get('/test')
            .set('X-API-Key', 'invalid')

          expect(res.status).toBe(401)
        })
      })
    })

    describe('when an API key is specified in the session cookie', () => {
      it('should authenticate as the matching user', async () => {
        const agent = request.agent(app)
        const cookieRes = await agent
          .get('/set-cookie')
          .query({
            name: Config.app.cookie.name,
            value: apiKey,
            expires: false
          })

        const res = await agent
          .get('/test')

        expect(res.status).toBe(200)
        expect(lastUserId).toEqual(userId)
      })

      describe('if the API key does not match a user', () => {
        it('should return a 401', async () => {
          const res = await request(app)
            .get('/test')
            .set('Cookie', 'invalid')

          expect(res.status).toBe(401)
        })
      })
    })
  })
})
