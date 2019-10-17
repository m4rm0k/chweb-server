const expressHelper = require('>/test/support/express_helper')
const request = require('supertest')
const subject = require('./index')

const Connection = require('>/lib/database/Connection')
const Setting = require('>/models/Setting')
const User = require('>/models/User')

describe('controllers/settings', () => {
  let connection
  let app, agent
  let user

  beforeAll(async () => {
    connection = await Connection.connect()
    await global.removeAllMongoDocs()

    app = expressHelper.create()
    subject.bind(app)
    agent = request.agent(app)

    user = new User()
    user.username = 'test'
    user.password = 'test'
    await user.save()
  })

  beforeEach(async () => {
    let setting = new Setting()
    setting.key = 'defaultAction'
    setting.value = 'REJECT'
    await setting.save()

    setting = new Setting()
    setting.key = 'enableAnalytics'
    setting.value = true
    await setting.save()
  })

  afterAll(async () => {
    await global.removeAllMongoDocs()
    await connection.close()
  })

  describe('GET /', () => {
    it('should require a valid user API key', async () => {
      let res = await agent
        .get('/')
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(200)

      res = await agent
        .get('/')
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    it('should return all settings as an object in `data', async () => {
      const res = await agent
        .get('/')
        .query({ apiKey: user.apiKey })

      expect(res.body.data.defaultAction).toEqual('REJECT')
      expect(res.body.data.enableAnalytics).toBe(true)
    })
  })

  describe('GET /:key', () => {
    it('should require a valid user API key', async () => {
      let res = await agent
        .get('/defaultAction')
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(200)

      res = await agent
        .get('/defaultAction')
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    it('should return the value for :key in `data', async () => {
      const res = await agent
        .get('/defaultAction')
        .query({ apiKey: user.apiKey })

      expect(res.body.data).toEqual('REJECT')
    })

    it('should set status to 404 if the setting does not exist', async () => {
      const res = await agent
        .get('/nonexistent')
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(404)
    })
  })

  describe('POST /', () => {
    it('should require a valid user API key', async () => {
      let res = await agent
        .post('/')
        .query({ apiKey: user.apiKey })
        .send([{
          key: 'defaultAction',
          value: 'test'
        }])

      expect(res.status).toBe(200)

      res = await agent
        .post('/')
        .query({ apiKey: 'invalid' })
        .send([{
          key: 'defaultAction',
          value: 'test'
        }])

      expect(res.status).toBe(401)
    })

    it('should validate an array was submitted', async () => {
      const res = await agent
        .post('/')
        .query({ apiKey: user.apiKey })
        .send({ foo: 'bar' })

      expect(res.status).toBe(400)
    })

    it('should save the settings', async () => {
      let setting = await Setting.find('defaultAction')
      expect(setting.value).toEqual('REJECT')

      setting = await Setting.find('enableAnalytics')
      expect(setting.value).toBe(true)

      const res = await agent
        .post('/')
        .query({ apiKey: user.apiKey })
        .send([{
          key: 'defaultAction',
          value: 'test'
        }, {
          key: 'enableAnalytics',
          value: false
        }])

      setting = await Setting.find('defaultAction')
      expect(setting.value).toEqual('test')

      setting = await Setting.find('enableAnalytics')
      expect(setting.value).toBe(false)
    })
  })
})
