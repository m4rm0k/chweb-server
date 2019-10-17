const { Connection } = require('>/lib/database')
const { ObjectID } = require('mongodb')

const Counter = require('./')

describe('models/Counter', () => {
  let connection

  const createCounter = async (host, allowed, blocked) => {
    await connection
      .database
      .collection('counters')
      .insertOne({
        host,
        allowed,
        blocked
      })
  }

  beforeEach(async () => {
    connection = await Connection.connect()
    await connection.database.collection('counters').removeMany({})
    await createCounter('<all>', 5, 10)
    await createCounter('rastating.github.io', 1337, 0)
    await createCounter('google.com', 0, 20)
  })

  afterAll(async () => {
    await connection.database.collection('counters').removeMany({})
    await connection.close()
  })

  describe('.find', () => {
    it('should return the global counter when the `criteria` is `<all>`', async () => {
      const res = await Counter.find('<all>')
      expect(res.host).toEqual('<all>')
      expect(res.allowed).toEqual(5)
      expect(res.blocked).toEqual(10)
    })

    it('should return the counter for the specified domain in `criteria`', async () => {
      const res = await Counter.find('rastating.github.io')
      expect(res.host).toEqual('rastating.github.io')
      expect(res.allowed).toEqual(1337)
      expect(res.blocked).toEqual(0)
    })

    describe('if the domain has no counter in the database', () => {
      it('should return a `Counter` with the values set to `0`', async () => {
        const res = await Counter.find('new.host')
        expect(res.host).toEqual('new.host')
        expect(res.allowed).toEqual(0)
        expect(res.blocked).toEqual(0)
      })
    })

    it('should populate the `host` property', async () => {
      const res = await Counter.find('rastating.github.io')
      expect(res.host).toEqual('rastating.github.io')
    })

    it('should populate the `allowed` property', async () => {
      const res = await Counter.find('rastating.github.io')
      expect(res.allowed).toEqual(1337)
    })

    it('should populate the `blocked` property', async () => {
      const res = await Counter.find('rastating.github.io')
      expect(res.blocked).toEqual(0)
    })
  })

  describe('.all', () => {
    it('should return an array of `Counter` objects (excluding the global counter)', async () => {
      const res = await Counter.all()
      expect(res).toHaveLength(2)
    })

    it('should populate the `host` property of each object', async () => {
      const res = await Counter.all()
      for (const counter of res) {
        expect(counter.host).not.toBeUndefined()
      }
    })

    it('should populate the `allowed` property of each object', async () => {
      const res = await Counter.all()
      for (const counter of res) {
        expect(counter.allowed).not.toBeUndefined()
      }
    })

    it('should populate the `blocked` property of each object', async () => {
      const res = await Counter.all()
      for (const counter of res) {
        expect(counter.blocked).not.toBeUndefined()
      }
    })

    it('should allow a custom sort to be defined', async () => {
      let res = await Counter.all({
        sort: { allowed: -1 }
      })

      expect(res[0].host).toEqual('rastating.github.io')
      expect(res[1].host).toEqual('google.com')

      res = await Counter.all({
        sort: { allowed: 1 }
      })

      expect(res[1].host).toEqual('rastating.github.io')
      expect(res[0].host).toEqual('google.com')
    })

    it('should allow a custom limit to be defined', async () => {
      const res = await Counter.all({
        sort: { allowed: -1 },
        limit: 1
      })

      expect(res[0].host).toEqual('rastating.github.io')
      expect(res).toHaveLength(1)
    })
  })

  describe('#save', () => {
    describe('when the host does not exist', () => {
      it('should insert a new document', async () => {
        const res = await Counter.find('new.host')
        const count = await connection
          .database
          .collection('counters')
          .countDocuments({ host: 'new.host' })

        expect(count).toBe(0)

        res.allowed = 1
        res.blocked = 2
        await res.save()

        const doc = await connection
          .database
          .collection('counters')
          .findOne({ host: 'new.host' })

        expect(doc.allowed).toBe(1)
        expect(doc.blocked).toBe(2)
      })
    })

    describe('when the host exists in the database', () => {
      it('should update the existing document', async () => {
        const res = await Counter.find('rastating.github.io')
        let count = await connection
          .database
          .collection('counters')
          .countDocuments({ host: 'rastating.github.io' })

        expect(count).toBe(1)

        res.allowed = 1001
        res.blocked = 1002
        await res.save()

        count = await connection
          .database
          .collection('counters')
          .countDocuments({ host: 'rastating.github.io' })

        expect(count).toBe(1)

        const doc = await connection
          .database
          .collection('counters')
          .findOne({ host: 'rastating.github.io' })

        expect(doc.allowed).toBe(1001)
        expect(doc.blocked).toBe(1002)
      })
    })
  })

  describe('#increment', () => {
    describe('when `action` is `allowed`', () => {
      it('should increment the `allowed` property by 1', async () => {
        let counter = await Counter.find('new.host')

        for (let i = 0; i < 5; i++) {
          await counter.increment({ action: 'allowed' })
        }

        counter = await Counter.find('new.host')
        expect(counter.allowed).toBe(5)
      })
    })

    describe('when `action` is `blocked`', () => {
      it('should increment the `blocked` property by 1', async () => {
        let counter = await Counter.find('new.host')

        for (let i = 0; i < 3; i++) {
          await counter.increment({ action: 'blocked' })
        }

        counter = await Counter.find('new.host')
        expect(counter.blocked).toBe(3)
      })
    })
  })
})
