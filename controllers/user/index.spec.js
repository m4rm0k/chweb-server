const cookieParser = require('cookie-parser')
const config = require('>/lib/config')
const expressHelper = require('>/test/support/express_helper')
const middleware = require('./middleware')
const request = require('supertest')
const subject = require('./index')

const Connection = require('>/lib/database/Connection')
const ObjectID = require('mongodb').ObjectID
const User = require('>/models/User')

describe('controllers/user', () => {
  let connection
  let app, agent
  let user

  beforeAll(async () => {
    connection = await Connection.connect()

    app = expressHelper.create()
    subject.bind(app)
    agent = request.agent(app)

    user = new User()
    user.username = 'user-ctrl-spec'
    user.apiKey = new ObjectID().toString()
    await user.save()
    await user.setPassword('Passw0rd1')
  })

  afterAll(async () => {
    await connection.client.close()
  })

  describe('module.exports', () => {
    it('should export the middleware module', () => {
      expect(subject.middleware).toEqual(middleware)
    })
  })

  describe('GET /', () => {
    const endpoint = '/'

    it('should require a valid user API key', async () => {
      let res = await agent
        .get(endpoint)
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(200)

      res = await agent
        .get(endpoint)
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    it('should return the user object of the current user', async () => {
      const res = await agent
        .get(endpoint)
        .query({ apiKey: user.apiKey })

      expect(res.body.data).toEqual({
        id: user.id.toString(),
        apiKey: user.apiKey,
        username: user.username
      })
    })
  })

  describe('POST /authenticate', () => {
    const endpoint = '/authenticate'

    describe('if the username or password is incorrect', () => {
      it('should set `success` to false', async () => {
        const res = await agent
          .post(endpoint)
          .send({
            username: user.username,
            password: 'Passw0rd2'
          })

        expect(res.body.success).toBe(false)
      })
    })

    describe('if the username and password are correct', () => {
      it('should set `success` to true', async () => {
        const res = await agent
          .post(endpoint)
          .send({
            username: user.username,
            password: 'Passw0rd1'
          })

        expect(res.body.success).toBe(true)
      })

      it('should set a session cookie using the name in the app config', async () => {
        const res = await agent
          .post(endpoint)
          .send({
            username: user.username,
            password: 'Passw0rd1'
          })

        expect(res.headers['set-cookie'][0]).toMatch(/^chweb=/)
      })

      it('should set a HttpOnly session cookie', async () => {
        const res = await agent
          .post(endpoint)
          .send({
            username: user.username,
            password: 'Passw0rd1'
          })

        expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/)
        const pattern = /=(.+?);/
        const cookie = decodeURIComponent(pattern.exec(res.headers['set-cookie'][0])[1])
        const key = cookieParser.signedCookie(cookie, config.app.cookie.secret)
        expect(key).toEqual(user.apiKey)
      })

      describe('if `body.rememberMe` is `true`', () => {
        it('should set the session cookie with an expiration date', async () => {
          const res = await agent
            .post(endpoint)
            .send({
              username: user.username,
              password: 'Passw0rd1',
              rememberMe: true
            })

          const day = 60 * 60 * 24 * 1000
          let expectedDate = new Date()
          expectedDate.setUTCHours(0, 0, 0, 0)
          expectedDate = new Date(expectedDate.getTime() + (day * 30))

          expect(res.headers['set-cookie'][0]).toContain(
            `Expires=${expectedDate.toUTCString()}`
          )
        })
      })

      describe('if `body.rememberMe` is falsey', () => {
        it('should set the session cookie without an expiration date', async () => {
          const res = await agent
            .post(endpoint)
            .send({
              username: user.username,
              password: 'Passw0rd1'
            })

          expect(res.headers['set-cookie'][0]).not.toContain('Expires=')
        })
      })
    })
  })
})
