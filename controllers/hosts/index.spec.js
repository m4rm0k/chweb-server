const expressHelper = require('>/test/support/express_helper')
const middleware = require('./middleware')
const request = require('supertest')
const subject = require('./index')

const Connection = require('>/lib/database/Connection')
const ObjectID = require('mongodb').ObjectID
const User = require('>/models/User')

describe('controllers/host', () => {
  const endpoint = '/api/v1/hosts'
  const hostsToInsert = [{
    _id: new ObjectID(),
    name: 'Host 1',
    apiKey: new ObjectID().toString()
  }, {
    _id: new ObjectID(),
    name: 'Host 2',
    apiKey: new ObjectID().toString()
  }]

  let hosts
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
    user.apiKey = new ObjectID().toString()
    await user.save()
  })

  afterAll(async () => {
    await global.removeAllMongoDocs()
    await connection.client.close()
  })

  beforeEach(async () => {
    hosts = []

    await connection.database
      .collection('hosts')
      .insertMany(hostsToInsert)

    for (let i = 0; i < hostsToInsert.length; i++) {
      hosts.push({
        id: hostsToInsert[i]._id.toString(),
        name: hostsToInsert[i].name,
        apiKey: hostsToInsert[i].apiKey
      })
    }
  })

  afterEach(async () => {
    await connection.database
      .collection('hosts')
      .removeMany({})
  })

  describe('module.exports', () => {
    it('should contain the middleware module', () => {
      expect(subject.middleware).toEqual(middleware)
    })
  })

  describe('GET /api/v1/hosts', () => {
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

    it('should return the hosts as an array in `data`', async () => {
      const res = await agent
        .get(endpoint)
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual(hosts)
    })
  })

  describe('PUT /api/v1/hosts', () => {
    it('should require a valid user API key', async () => {
      let res = await agent
        .put(endpoint)
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(400)

      res = await agent
        .get(endpoint)
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    it('should validate a name was specified', async () => {
      const res = await agent
        .put(endpoint)
        .query({ apiKey: user.apiKey })
        .send({})

      expect(res.status).toBe(400)
    })

    it('should add the host to the hosts collection', async () => {
      const res = await agent
        .put(endpoint)
        .query({ apiKey: user.apiKey })
        .send({ name: 'new host' })

      expect(res.status).toBe(200)

      const count = await connection
        .database
        .collection('hosts')
        .countDocuments({
          name: 'new host'
        })

      expect(count).toEqual(1)
    })

    it('should return the new host object', async () => {
      const res = await agent
        .put(endpoint)
        .query({ apiKey: user.apiKey })
        .send({ name: 'new host' })

      expect(res.body.data.name).toEqual('new host')
      expect(res.body.data.id).toMatch(/[a-f0-9]{12}/i)
      expect(res.body.data.apiKey).toMatch(/[a-f0-9]{12}/i)
    })
  })

  describe('POST /api/v1/hosts', () => {
    it('should require a valid user API key', async () => {
      let res = await agent
        .post(endpoint)
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(400)

      res = await agent
        .get(endpoint)
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    it('should validate an id was specified', async () => {
      const res = await agent
        .post(endpoint)
        .query({ apiKey: user.apiKey })
        .send({ name: 'updated' })

      expect(res.status).toBe(400)
    })

    it('should validate a name was specified', async () => {
      const res = await agent
        .post(endpoint)
        .query({ apiKey: user.apiKey })
        .send({ id: hosts[0].id })

      expect(res.status).toBe(400)
    })

    it('should update the specified host', async () => {
      const res = await agent
        .post(endpoint)
        .query({ apiKey: user.apiKey })
        .send({
          id: hosts[0].id,
          name: 'updated'
        })

      expect(res.status).toBe(200)

      const doc = await connection
        .database
        .collection('hosts')
        .findOne({
          _id: hostsToInsert[0]._id
        })

      expect(doc.name).toEqual('updated')
    })

    it('should return the updated host object', async () => {
      const res = await agent
        .post(endpoint)
        .query({ apiKey: user.apiKey })
        .send({
          id: hosts[0].id,
          name: 'updated'
        })

      expect(res.body.data).toEqual({
        id: hosts[0].id,
        name: 'updated',
        apiKey: hosts[0].apiKey
      })
    })
  })

  describe('GET /api/v1/hosts/:id', () => {
    it('should require a valid user API key', async () => {
      const endpoint = `/api/v1/hosts/${hosts[0].id}`
      let res = await agent
        .get(endpoint)
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(200)

      res = await agent
        .get(endpoint)
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    it('should return the host in `data`', async () => {
      const endpoint = `/api/v1/hosts/${hosts[0].id}`
      const res = await agent
        .get(endpoint)
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(200)
      expect(res.body.data).toEqual(hosts[0])
    })
  })

  describe('DELETE /api/v1/hosts/:id', () => {
    it('should require a valid user API key', async () => {
      let res = await agent
        .delete(`${endpoint}/${hosts[0].id}`)
        .query({ apiKey: user.apiKey })

      expect(res.status).toBe(200)

      res = await agent
        .get(endpoint)
        .query({ apiKey: 'invalid' })

      expect(res.status).toBe(401)
    })

    it('should delete the specified host', async () => {
      const res = await agent
        .delete(`${endpoint}/${hosts[0].id}`)
        .query({
          apiKey: user.apiKey
        })

      expect(res.status).toBe(200)

      const count = await connection
        .database
        .collection('hosts')
        .countDocuments({
          _id: hostsToInsert[0]._id
        })

      expect(count).toBe(0)
    })
  })
})
