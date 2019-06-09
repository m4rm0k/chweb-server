const collection = require('./collection')
const mongodb = require('mongodb')

describe('lib/database/Connection', () => {
  const subject = require('./Connection')
  let connection

  async function connect () {
    connection = await subject.connect()
    return connection
  }

  afterEach(async () => {
    await connection.client.close()
  })

  describe('.connect', () => {
    it('should resolve with the client and database object', async () => {
      const db = await connect()
      expect(db.client).toBeInstanceOf(mongodb.MongoClient)
      expect(db.database).toBeInstanceOf(mongodb.Db)
    })

    it('should resolve the same connection object on subsequent calls', async () => {
      const connection1 = await connect()
      const connection2 = await connect()
      expect(connection1).toBe(connection2)
    })

    it('should create the `users` collection', async () => {
      const connection = await connect()
      const exists = await collection.checkCollectionExists(connection.database, 'users')
      expect(exists).toBe(true)
    })

    it('creates the `rules` collection', async () => {
      const connection = await connect()
      const exists = await collection.checkCollectionExists(connection.database, 'rules')
      expect(exists).toBe(true)
    })

    it('should create the `hosts` collection', async () => {
      const connection = await connect()
      const exists = await collection.checkCollectionExists(connection.database, 'hosts')
      expect(exists).toBe(true)
    })

    it('should create the `settings` collection', async () => {
      const connection = await connect()
      const exists = await collection.checkCollectionExists(connection.database, 'settings')
      expect(exists).toBe(true)
    })
  })
})
