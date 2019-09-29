const expressHelper = require('>/test/support/express_helper')
const request = require('supertest')
const subject = require('./index')

const Connection = require('>/lib/database/Connection')
const Host = require('>/models/Host')
const ObjectID = require('mongodb').ObjectID
const User = require('>/models/User')

describe('controllers/rules', () => {
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
  let host, user

  beforeAll(async () => {
    connection = await Connection.connect()

    await global.removeAllMongoDocs()

    app = expressHelper.create()
    subject.bind(app)

    host = new Host()
    host.name = 'Test'
    host.apiKey = new ObjectID().toString()
    await host.save()

    user = new User()
    user.username = 'test'
    user.apiKey = new ObjectID().toString()
    await user.save()

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

    it('should return the current ruleset as an array in `data`', async () => {
      const res = await agent
        .get('/')
        .query({ apiKey: user.apiKey })

      expect(res.body.data).toEqual(rules)
    })
  })

  describe('PUT /', () => {
    it('should require a valid user API key', async () => {
      let res = await agent
        .put('/')
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(400)

      res = await agent
        .put('/')
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    it('should validate a host was specified', async () => {
      const res = await agent
        .put('/')
        .query({ apiKey: user.apiKey })
        .send({
          action: 'REJECT',
          type: 'ACCESS'
        })

      expect(res.status).toBe(400)
    })

    it('should validate an action was specified', async () => {
      const res = await agent
        .put('/')
        .query({ apiKey: user.apiKey })
        .send({
          host: '*.google.com',
          type: 'ACCESS'
        })

      expect(res.status).toBe(400)
    })

    it('should validate a rule type was specified', async () => {
      const res = await agent
        .put('/')
        .query({ apiKey: user.apiKey })
        .send({
          action: 'REJECT',
          host: '*.google.com'
        })

      expect(res.status).toBe(400)
    })

    it('should add the rule to the rules collection', async () => {
      const res = await agent
        .put('/')
        .query({ apiKey: user.apiKey })
        .send({
          action: 'REJECT',
          type: 'ACCESS',
          host: '*.unit.test'
        })

      expect(res.status).toBe(200)
      const count = await connection.database
        .collection('rules')
        .countDocuments({ host: '*.unit.test' })

      expect(count).toBe(1)
    })

    it('should return the new rule object', async () => {
      const res = await agent
        .put('/')
        .query({ apiKey: user.apiKey })
        .send({
          action: 'REJECT',
          type: 'ACCESS',
          host: '*.unit.test'
        })

      const rule = await connection.database
        .collection('rules')
        .findOne({ host: '*.unit.test' })

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({
        id: rule._id.toString(),
        action: rule.action,
        type: rule.type,
        host: rule.host
      })
    })
  })

  describe('GET /:id', () => {
    it('should require a valid user API key', async () => {
      let res = await agent
        .get(`/${rules[0].id}`)
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(200)

      res = await agent
        .get(`/${rules[0].id}`)
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    it('should require a valid rule id', async () => {
      const res = await agent
        .get(`/${(new ObjectID()).toString()}`)
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(404)
    })

    it('should return the rule in `data`', async () => {
      const res = await agent
        .get(`/${rules[0].id}`)
        .query({ apiKey: user.apiKey })

      expect(res.body.data).toEqual(rules[0])
    })
  })

  describe('DELETE /:id', () => {
    it('should require a valid user API key', async () => {
      let res = await agent
        .delete(`/${rules[0].id}`)
        .query({ apiKey: user.apiKey })

      expect(res.status).not.toBe(401)

      res = await agent
        .delete(`/${rules[0].id}`)
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    it('should validate a rule ID was specified', async () => {
      const res = await agent
        .delete('/invalid')
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(400)
    })

    it('should delete the specified rule', async () => {
      const doc = await connection.database
        .collection('rules')
        .findOne({ host: 'rastating.github.io' })

      const res = await agent
        .delete(`/${rules[0].id}`)
        .query({
          apiKey: user.apiKey
        })

      expect(res.status).toBe(200)

      const count = await connection.database
        .collection('rules')
        .countDocuments({ host: 'rastating.github.io' })

      expect(count).toBe(0)
    })
  })

  describe('POST /', () => {
    it('should require a valid user API key', async () => {
      let res = await agent
        .post('/')
        .query({ apiKey: user.apiKey })

      expect(res.status).not.toBe(401)

      res = await agent
        .post('/')
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    describe('when an array of rules are in the body', () => {
      it('should validate a host was specified for each rule', async () => {
        const res = await agent
          .post('/')
          .query({ apiKey: user.apiKey })
          .send([{
            id: rules[0].id,
            type: 'ACCESS',
            action: 'ALLOW',
            host: 'rastating.github.io'
          },
          {
            id: rules[1].id,
            type: 'ACCESS',
            action: 'ALLOW'
          }])

        expect(res.status).toBe(400)
      })

      it('should validate an action was specified for each rule', async () => {
        const res = await agent
          .post('/')
          .query({ apiKey: user.apiKey })
          .send([{
            id: rules[0].id,
            type: 'ACCESS',
            action: 'ALLOW',
            host: 'rastating.github.io'
          },
          {
            id: rules[1].id,
            type: 'ACCESS',
            host: 'google.com'
          }])

        expect(res.status).toBe(400)
      })

      it('should validate a rule type was specified for each rule', async () => {
        const res = await agent
          .post('/')
          .query({ apiKey: user.apiKey })
          .send([{
            id: rules[0].id,
            type: 'ACCESS',
            action: 'ALLOW',
            host: 'rastating.github.io'
          },
          {
            id: rules[1].id,
            action: 'ALLOW',
            host: 'google.com'
          }])

        expect(res.status).toBe(400)
      })

      it('should update the specified rules', async () => {
        const res = await agent
          .post('/')
          .query({ apiKey: user.apiKey })
          .send([{
            id: rules[0].id,
            type: 'EDITED.TYPE.1',
            action: 'EDITED.ACTION.1',
            host: 'edited.1'
          },
          {
            id: rules[1].id,
            type: 'EDITED.TYPE.2',
            action: 'EDITED.ACTION.2',
            host: 'edited.2'
          }])

        expect(res.status).toBe(200)
        let rule = await connection.database
          .collection('rules')
          .findOne({ _id: new ObjectID(rules[0].id) })

        expect(rule.type).toEqual('EDITED.TYPE.1')
        expect(rule.action).toEqual('EDITED.ACTION.1')
        expect(rule.host).toEqual('edited.1')

        rule = await connection.database
          .collection('rules')
          .findOne({ _id: new ObjectID(rules[1].id) })

        expect(rule.type).toEqual('EDITED.TYPE.2')
        expect(rule.action).toEqual('EDITED.ACTION.2')
        expect(rule.host).toEqual('edited.2')
      })

      it('should return the updated rule objects', async () => {
        const res = await agent
          .post('/')
          .query({ apiKey: user.apiKey })
          .send([{
            id: rules[0].id,
            type: 'EDITED.TYPE.1',
            action: 'EDITED.ACTION.1',
            host: 'edited.1'
          },
          {
            id: rules[1].id,
            type: 'EDITED.TYPE.2',
            action: 'EDITED.ACTION.2',
            host: 'edited.2'
          }])

        expect(res.status).toBe(200)
        expect(res.body.data).toEqual([{
          id: rules[0].id,
          type: 'EDITED.TYPE.1',
          action: 'EDITED.ACTION.1',
          host: 'edited.1'
        },
        {
          id: rules[1].id,
          type: 'EDITED.TYPE.2',
          action: 'EDITED.ACTION.2',
          host: 'edited.2'
        }])
      })
    })

    describe('when a single rule is submitted', () => {
      it('should validate a host was specified', async () => {
        const res = await agent
          .post('/')
          .query({ apiKey: user.apiKey })
          .send({
            id: rules[1].id,
            type: 'ACCESS',
            action: 'ALLOW'
          })

        expect(res.status).toBe(400)
      })

      it('should validate an action was specified', async () => {
        const res = await agent
          .post('/')
          .query({ apiKey: user.apiKey })
          .send({
            id: rules[1].id,
            type: 'ACCESS',
            host: 'google.com'
          })

        expect(res.status).toBe(400)
      })

      it('should validate a rule type was specified', async () => {
        const res = await agent
          .post('/')
          .query({ apiKey: user.apiKey })
          .send({
            id: rules[1].id,
            action: 'ALLOW',
            host: 'google.com'
          })

        expect(res.status).toBe(400)
      })

      it('should update the specified rule', async () => {
        const res = await agent
          .post('/')
          .query({ apiKey: user.apiKey })
          .send({
            id: rules[1].id,
            type: 'EDITED.TYPE.2',
            action: 'EDITED.ACTION.2',
            host: 'edited.2'
          })

        expect(res.status).toBe(200)

        const rule = await connection.database
          .collection('rules')
          .findOne({ _id: new ObjectID(rules[1].id) })

        expect(rule.type).toEqual('EDITED.TYPE.2')
        expect(rule.action).toEqual('EDITED.ACTION.2')
        expect(rule.host).toEqual('edited.2')
      })

      it('should return the updated rule object', async () => {
        const res = await agent
          .post('/')
          .query({ apiKey: user.apiKey })
          .send({
            id: rules[1].id,
            type: 'EDITED.TYPE.2',
            action: 'EDITED.ACTION.2',
            host: 'edited.2'
          })

        expect(res.status).toBe(200)
        expect(res.body.data).toEqual([{
          id: rules[1].id,
          type: 'EDITED.TYPE.2',
          action: 'EDITED.ACTION.2',
          host: 'edited.2'
        }])
      })
    })
  })
})
