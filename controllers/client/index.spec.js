const expressHelper = require('>/test/support/express_helper')
const request = require('supertest')
const subject = require('./index')

const Connection = require('>/lib/database/Connection')
const Host = require('>/models/Host')
const ObjectID = require('mongodb').ObjectID

describe('controllers/client', () => {
  const rulesToInsert = [{
    _id: new ObjectID(),
    type: 'ACCESS',
    action: 'ALLOW',
    host: 'rastating.github.io'
  },
  {
    _id: new ObjectID(),
    type: 'ACCESS',
    action: 'ALLOW',
    host: '*.google.com'
  },
  {
    _id: new ObjectID(),
    type: 'ACCESS',
    action: 'ALLOW',
    host: 'r*ting.com'
  }]

  let rules
  let connection
  let app, agent
  let host

  beforeAll(async () => {
    connection = await Connection.connect()

    await global.removeAllMongoDocs()

    app = expressHelper.create()
    subject.bind(app)
    agent = request.agent(app)
  })

  afterAll(async () => {
    await global.removeAllMongoDocs()
    await connection.client.close()
  })

  beforeEach(async () => {
    rules = []

    await connection.database
      .collection('rules')
      .insertMany(rulesToInsert)

    host = new Host()
    host.name = 'Test'
    host.apiKey = new ObjectID().toString()
    await host.save()

    await connection.database
      .collection('settings')
      .updateOne({
        key: 'defaultAction'
      }, {
        $set: {
          key: 'defaultAction',
          value: 'REJECT'
        }
      }, {
        upsert: true
      })

    for (let i = 0; i < rulesToInsert.length; i++) {
      const rule = {
        id: rulesToInsert[i]._id.toString(),
        action: rulesToInsert[i].action,
        type: rulesToInsert[i].type,
        host: rulesToInsert[i].host
      }

      rules.push(rule)
    }
  })

  afterEach(async () => {
    await connection.database.collection('rules').removeMany({})
  })

  describe('GET /api/v1/client/config', () => {
    const endpoint = '/api/v1/client/config'

    it('should require a valid host API key', async () => {
      let res = await agent
        .get(endpoint)
        .query({ apiKey: host.apiKey })

      expect(res.status).toBe(200)

      res = await agent
        .get(endpoint)
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    it('should return the current ruleset as an array in `data.rules`', async () => {
      const res = await agent
        .get(endpoint)
        .query({ apiKey: host.apiKey })

      expect(res.body.data.rules).toEqual(rules)
    })

    it('should return the default action in `data.defaultAction`', async () => {
      const res = await agent
        .get(endpoint)
        .query({ apiKey: host.apiKey })

      expect(res.body.data.defaultAction).toEqual('REJECT')
    })

    it('should update the last seen date of the host accessing the endpoint', async () => {
      const timestamp = Date.now()
      expect(host.lastSeen).toBeFalsy()

      await agent
        .get(endpoint)
        .query({ apiKey: host.apiKey })

      host = await Host.find(host.id)
      expect(host.lastSeen).toBeTruthy()
      expect(host.lastSeen).toBeGreaterThanOrEqual(timestamp)
    })
  })
})
