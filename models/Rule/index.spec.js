const Connection = require('>/lib/database/Connection')
const Rule = require('./index')
const ObjectID = require('mongodb').ObjectID

describe('models/Rule', () => {
  let connection
  let lastRule

  beforeEach(async () => {
    connection = await Connection.connect()
    await connection.database.collection('rules').removeMany({})

    const insertRes = await connection.database
      .collection('rules')
      .insertOne({
        type: 'ACCESS',
        action: 'ALLOW',
        host: 'rastating.github.io'
      })

    lastRule = insertRes.ops[0]

    await connection.database
      .collection('rules')
      .insertOne({
        type: 'second type',
        action: 'second action',
        host: 'second host'
      })
  })

  afterAll(async () => {
    await connection.database.collection('rules').removeMany({})
    await connection.client.close()
  })

  describe('.find', () => {
    it('should return a `Rule` instance', async () => {
      const rule = await Rule.find(lastRule._id)
      expect(rule).toBeInstanceOf(Rule)
    })

    it('should support passing the id as either an `ObjectID` or string', async () => {
      let rule = await Rule.find(lastRule._id)
      expect(rule).toBeInstanceOf(Rule)

      rule = await Rule.find(lastRule._id.toString())
      expect(rule).toBeInstanceOf(Rule)
    })

    it('should return null when a rule cannot be found', async () => {
      const rule = await Rule.find('AAAAAAAAAAAAAAAAAAAAAAAA')
      expect(rule).toBeNull()
    })

    it('should populate the `id` property', async () => {
      const rule = await Rule.find(lastRule._id)
      expect(rule.id).toEqual(lastRule._id)
    })

    it('should populate the `type` property', async () => {
      const rule = await Rule.find(lastRule._id)
      expect(rule.type).toEqual(lastRule.type)
    })

    it('should populate the `action` property', async () => {
      const rule = await Rule.find(lastRule._id)
      expect(rule.action).toEqual(lastRule.action)
    })

    it('should populate the `host` property', async () => {
      const rule = await Rule.find(lastRule._id)
      expect(rule.host).toEqual(lastRule.host)
    })
  })

  describe('.all', () => {
    it('should return an array of `Rule` objects', async () => {
      const rules = await Rule.all()
      expect(rules.length).toBe(2)
      for (let i = 0; i < 2; i++) {
        expect(rules[i]).toBeInstanceOf(Rule)
      }
    })

    it('should populate the `id` property of each object', async () => {
      const rules = await Rule.all()
      for (let i = 0; i < 2; i++) {
        expect(rules[i].id).toBeInstanceOf(ObjectID)
      }
    })

    it('should populate the `type` property of each object', async () => {
      const rules = await Rule.all()
      for (let i = 0; i < 2; i++) {
        expect(rules[i].type).not.toBeNull()
      }
    })

    it('should populate the `action` property of each object', async () => {
      const rules = await Rule.all()
      for (let i = 0; i < 2; i++) {
        expect(rules[i].action).not.toBeNull()
      }
    })

    it('should populate the `host` property of each object', async () => {
      const rules = await Rule.all()
      for (let i = 0; i < 2; i++) {
        expect(rules[i].host).not.toBeNull()
      }
    })
  })

  describe('#save', () => {
    describe('when `rule.id` does not exist in the database', () => {
      it('should insert a new document', async () => {
        const rule = new Rule()
        rule.type = 'ACCESS'
        rule.action = 'ALLOW'
        rule.host = 'save-test'
        await rule.save()

        const count = await connection
          .database
          .collection('rules')
          .countDocuments({})

        expect(count).toEqual(3)
      })

      it('should store the new object ID in `rule.id`', async () => {
        const rule = new Rule()
        rule.type = 'ACCESS'
        rule.action = 'ALLOW'
        rule.host = 'save-test'
        await rule.save()

        const newRule = await connection
          .database
          .collection('rules')
          .findOne({ host: 'save-test' })

        expect(rule.id).toBeInstanceOf(ObjectID)
        expect(rule.id).toEqual(newRule._id)
      })
    })

    describe('when `rule.id` exists in the database', () => {
      it('should update the existing document', async () => {
        const rule = await Rule.find(lastRule._id)
        rule.host = 'updated'
        await rule.save()

        expect(rule.id).toEqual(lastRule._id)

        const totalCount = await connection
          .database
          .collection('rules')
          .countDocuments({})

        expect(totalCount).toEqual(2)

        const updatedCount = await connection
          .database
          .collection('rules')
          .countDocuments({ host: 'updated' })

        expect(updatedCount).toEqual(1)
      })
    })

    it('should return true on a successful save', async () => {
      const rule = await Rule.find(lastRule._id)
      rule.host = 'updated'
      const res = await rule.save()
      expect(res).toBe(true)
    })

    it('should return false on an unsuccessful save', async () => {
      const MockedRule = require('./index')

      MockedRule.__set__({
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

      const rule = new MockedRule()
      const res = await rule.save()
      expect(res).toBe(false)
    })
  })
})
