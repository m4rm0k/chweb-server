const Connection = require('>/lib/database/Connection')
const Host = require('./index')
const ObjectID = require('mongodb').ObjectID

describe('models/Host', () => {
  const lastSeen = 1563052562 * 1000
  let connection
  let lastHost

  beforeEach(async () => {
    connection = await Connection.connect()
    await connection.database.collection('hosts').removeMany({})

    const insertRes = await connection.database.collection('hosts').insertOne({
      apiKey: '1234-5678',
      name: 'Test Host',
      lastSeen: lastSeen
    })

    lastHost = insertRes.ops[0]

    await connection.database.collection('hosts').insertOne({
      apiKey: new ObjectID().toString(),
      name: 'Test Host 2',
      lastSeen: lastSeen
    })
  })

  afterEach(async () => {
    await connection.database.collection('hosts').removeMany({})
    await connection.client.close()
  })

  describe('.find', () => {
    it('should return a `Host` instance', async () => {
      const host = await Host.find(lastHost._id)
      expect(host).toBeInstanceOf(Host)
    })

    it('should support passing the id as either an `ObjectID` or string', async () => {
      let host = await Host.find(lastHost._id)
      expect(host).toBeInstanceOf(Host)

      host = await Host.find(lastHost._id.toString())
      expect(host).toBeInstanceOf(Host)
    })

    it('should return null when a host cannot be found', async () => {
      const host = await Host.find('AAAAAAAAAAAAAAAAAAAAAAAA')
      expect(host).toBeNull()
    })

    it('should populate the `id` property', async () => {
      const host = await Host.find(lastHost._id)
      expect(host.id).toEqual(lastHost._id)
    })

    it('should populate the `apiKey` property', async () => {
      const host = await Host.find(lastHost._id)
      expect(host.apiKey).toEqual(lastHost.apiKey)
    })

    it('should populate the `name` property', async () => {
      const host = await Host.find(lastHost._id)
      expect(host.name).toEqual(lastHost.name)
    })

    it('should populate the `lastSeen` property', async () => {
      const host = await Host.find(lastHost._id)
      expect(host.lastSeen).toEqual(lastHost.lastSeen)
    })
  })

  describe('.findByKey', () => {
    it('should return a `Host` instance', async () => {
      const host = await Host.findByKey(lastHost.apiKey)
      expect(host).toBeInstanceOf(Host)
    })

    it('should return null when a host cannot be found', async () => {
      const host = await Host.findByKey('AAAAAAAAAAAAAAAAAAAAAAAA')
      expect(host).toBeNull()
    })

    it('should populate the `id` property', async () => {
      const host = await Host.findByKey(lastHost.apiKey)
      expect(host.id).toEqual(lastHost._id)
    })

    it('should populate the `apiKey` property', async () => {
      const host = await Host.findByKey(lastHost.apiKey)
      expect(host.apiKey).toEqual(lastHost.apiKey)
    })

    it('should populate the `name` property', async () => {
      const host = await Host.findByKey(lastHost.apiKey)
      expect(host.name).toEqual(lastHost.name)
    })

    it('should populate the `lastSeen` property', async () => {
      const host = await Host.findByKey(lastHost.apiKey)
      expect(host.lastSeen).toEqual(lastHost.lastSeen)
    })
  })

  describe('.all', () => {
    it('should return an array of `Rule` objects', async () => {
      const hosts = await Host.all()
      expect(hosts.length).toBe(2)
      for (let i = 0; i < 2; i++) {
        expect(hosts[i]).toBeInstanceOf(Host)
      }
    })

    it('should populate the `id` property of each object', async () => {
      const hosts = await Host.all()
      for (let i = 0; i < 2; i++) {
        expect(hosts[i].id).toBeInstanceOf(ObjectID)
      }
    })

    it('should populate the `name` property of each object', async () => {
      const hosts = await Host.all()
      for (let i = 0; i < 2; i++) {
        expect(hosts[i].name).not.toBeUndefined()
      }
    })

    it('should populate the `apiKey` property of each object', async () => {
      const hosts = await Host.all()
      for (let i = 0; i < 2; i++) {
        expect(hosts[i].apiKey).not.toBeUndefined()
      }
    })

    it('should populate the `lastSeen` property of each object', async () => {
      const hosts = await Host.all()
      for (let i = 0; i < 2; i++) {
        expect(hosts[i].lastSeen).not.toBeUndefined()
      }
    })
  })

  describe('.delete', () => {
    it('should return true when a host is deleted', async () => {
      const res = await Host.delete(lastHost._id)
      expect(res).toBe(true)

      const count = await connection
        .database
        .collection('hosts')
        .countDocuments({ _id: lastHost._id })

      expect(count).toEqual(0)
    })

    it('should return false when the number of hosts deleted !== 1', async () => {
      const res = await Host.delete('AAAAAAAAAAAAAAAAAAAAAAAA')
      expect(res).toBe(false)
    })

    it('should support passing the id as either a string', async () => {
      const res = await Host.delete(lastHost._id.toString())
      expect(res).toBe(true)
    })
  })

  describe('#save', () => {
    describe('when `host.id` does not exist in the database', () => {
      it('should insert a new document', async () => {
        const host = new Host()
        host.apiKey = 'upserted key'
        host.name = 'upserted host'
        await host.save()

        const count = await connection
          .database
          .collection('hosts')
          .countDocuments({})

        expect(count).toEqual(3)
      })

      it('should store the new object ID in `host.id`', async () => {
        const host = new Host()
        host.apiKey = 'upserted key'
        host.name = 'upserted host'
        await host.save()

        const newHost = await connection
          .database
          .collection('hosts')
          .findOne({ name: 'upserted host' })

        expect(host.id).toBeInstanceOf(ObjectID)
        expect(host.id).toEqual(newHost._id)
      })
    })

    describe('when `host.id` exists in the database', () => {
      it('should update the existing document', async () => {
        const host = await Host.find(lastHost._id)
        host.name = 'updated'
        host.lastSeen = 1234
        await host.save()

        expect(host.id).toEqual(lastHost._id)

        const totalCount = await connection
          .database
          .collection('hosts')
          .countDocuments({})

        expect(totalCount).toEqual(2)

        const updatedCount = await connection
          .database
          .collection('hosts')
          .countDocuments({ name: 'updated', lastSeen: 1234 })

        expect(updatedCount).toEqual(1)
      })
    })

    it('should return true on a successful save', async () => {
      const host = await Host.find(lastHost._id)
      host.name = 'updated'
      const res = await host.save()
      expect(res).toBe(true)
    })

    it('should return false on an unsuccessful save', async () => {
      const MockedHost = require('./index')

      MockedHost.__set__({
        Connection: {
          connect: () => {
            return {
              database: {
                collection: () => {
                  return { updateOne: () => { throw new Error() } }
                }
              }
            }
          }
        }
      })

      const host = new MockedHost()
      const res = await host.save()
      expect(res).toBe(false)
    })
  })
})
