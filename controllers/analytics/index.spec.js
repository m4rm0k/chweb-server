const { Connection } = require('>/lib/database')
const { ObjectID } = require('mongodb')

const expressHelper = require('>/test/support/express_helper')
const request = require('supertest')

const Controller = require('./index')
const Counter = require('>/models/Counter')
const Host = require('>/models/Host')
const User = require('>/models/User')

describe('controllers/analytics', () => {
  let app, agent, host, user

  const createCounter = async (host, allowed, blocked) => {
    const counter = new Counter()
    counter.host = host
    counter.allowed = allowed
    counter.blocked = blocked
    await counter.save()
  }

  beforeEach(async () => {
    const connection = await Connection.connect()
    await connection.database.collection('counters').removeMany({})

    await createCounter('<all>', 5, 10)
    for (let i = 0; i < 10; i++) {
      await createCounter(`host-0${i}`, i, 0)
      await createCounter(`host-1${i}`, 0, i)
    }

    user = new User()
    user.username = 'test'
    user.apiKey = new ObjectID().toString()
    await user.save()

    host = new Host()
    host.name = 'Test'
    await host.save()

    app = expressHelper.create()
    Controller.bind(app)
    agent = request.agent(app)
  })

  afterAll(async () => {
    const connection = await Connection.connect()
    await connection.database.collection('counters').removeMany({})
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

    it('should include the global counter statistics in the response', async () => {
      const res = await agent
        .get('/')
        .query({ apiKey: user.apiKey })

      expect(res.body.counters.global).toEqual({
        allowed: 5,
        blocked: 10
      })
    })

    it('should include the 5 most blocked hosts in the response', async () => {
      const res = await agent
        .get('/')
        .query({ apiKey: user.apiKey })

      expect(res.body.counters.mostBlocked).toEqual([{
        host: 'host-19',
        blocked: 9,
        allowed: 0
      }, {
        host: 'host-18',
        blocked: 8,
        allowed: 0
      }, {
        host: 'host-17',
        blocked: 7,
        allowed: 0
      }, {
        host: 'host-16',
        blocked: 6,
        allowed: 0
      }, {
        host: 'host-15',
        blocked: 5,
        allowed: 0
      }])
    })

    it('should include the 5 most allowed hosts in the response', async () => {
      const res = await agent
        .get('/')
        .query({ apiKey: user.apiKey })

      expect(res.body.counters.mostAllowed).toEqual([{
        host: 'host-09',
        allowed: 9,
        blocked: 0
      }, {
        host: 'host-08',
        allowed: 8,
        blocked: 0
      }, {
        host: 'host-07',
        allowed: 7,
        blocked: 0
      }, {
        host: 'host-06',
        allowed: 6,
        blocked: 0
      }, {
        host: 'host-05',
        allowed: 5,
        blocked: 0
      }])
    })
  })

  describe('POST /', () => {
    it('should require a valid host API key', async () => {
      let res = await agent
        .post('/')
        .query({ apiKey: host.apiKey })

      expect(res.status).toBe(400)

      res = await agent
        .post('/')
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    it('should validate a `host` property was set', async () => {
      const res = await agent
        .post('/')
        .query({ apiKey: host.apiKey })
        .send({
          action: 'allowed'
        })

      expect(res.status).toBe(400)
    })

    it('should validate an `action` property was set', async () => {
      const res = await agent
        .post('/')
        .query({ apiKey: host.apiKey })
        .send({
          host: 'rastating.github.io'
        })

      expect(res.status).toBe(400)
    })

    it('should update the counter for the specified domain', async () => {
      let res = await agent
        .post('/')
        .query({ apiKey: host.apiKey })
        .send({
          action: 'allowed',
          host: 'host-01'
        })

      expect(res.status).toBe(200)

      let counter = await Counter.find('host-01')
      expect(counter.allowed).toBe(2)

      res = await agent
        .post('/')
        .query({ apiKey: host.apiKey })
        .send({
          action: 'blocked',
          host: 'host-11'
        })

      expect(res.status).toBe(200)

      counter = await Counter.find('host-11')
      expect(counter.blocked).toBe(2)
    })

    it('should update the global counter', async () => {
      await agent
        .post('/')
        .query({ apiKey: host.apiKey })
        .send({
          action: 'allowed',
          host: 'host-01'
        })

      await agent
        .post('/')
        .query({ apiKey: host.apiKey })
        .send({
          action: 'blocked',
          host: 'host-01'
        })

      const counter = await Counter.find('<all>')
      expect(counter.allowed).toBe(6)
      expect(counter.blocked).toBe(11)
    })

    it('should update the host counter', async () => {
      expect(host.counter.allowed).toBe(0)
      expect(host.counter.blocked).toBe(0)

      for (let i = 0; i < 6; i++) {
        await agent
          .post('/')
          .query({ apiKey: host.apiKey })
          .send({
            action: 'allowed',
            host: 'host-01'
          })
      }

      for (let i = 0; i < 11; i++) {
        await agent
          .post('/')
          .query({ apiKey: host.apiKey })
          .send({
            action: 'blocked',
            host: 'host-01'
          })
      }

      host = await Host.find(host.id)
      expect(host.counter.allowed).toBe(6)
      expect(host.counter.blocked).toBe(11)
    })
  })
})
