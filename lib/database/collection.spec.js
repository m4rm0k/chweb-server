const Connection = require('./Connection')
const subject = require('./collection')

describe('database/collection', () => {
  let connection

  async function connect () {
    connection = await subject.connect()
    return connection
  }

  beforeEach(async () => {
    connection = await Connection.connect()
  })

  afterEach(async () => {
    await connection.client.close()
  })

  describe('.createCollection', () => {
    afterEach(async () => {
      await connection.database.dropCollection('foo')
    })

    describe('if the collection already exists', () => {
      beforeEach(async () => {
        await connection.database.createCollection('foo')
      })

      it('should resolve indicating it was not created', async () => {
        const res = await subject.createCollection(connection.database, 'foo')
        expect(res.created).toBe(false)
      })
    })

    describe('if the collection does not exist', () => {
      it('should resolve indicating it was created', async () => {
        const res = await subject.createCollection(connection.database, 'foo')
        expect(res.created).toBe(true)
      })
    })
  })

  describe('#checkCollectionExists', () => {
    describe('if the collection exists', () => {
      beforeEach(async () => {
        await connection.database.createCollection('foo')
      })

      afterEach(async () => {
        await connection.database.dropCollection('foo')
      })

      it('should resolve with `true`', async () => {
        const res = await subject.checkCollectionExists(connection.database, 'foo')
        expect(res).toBe(true)
      })
    })

    describe('if the collection does not exist', () => {
      it('should resolve with {false}', async () => {
        const res = await subject.checkCollectionExists(connection.database, 'foo')
        expect(res).toBe(false)
      })
    })
  })
})
