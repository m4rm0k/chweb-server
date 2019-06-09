const bcrypt = require('bcrypt')

const Connection = require('>/lib/database/Connection')
const User = require('./index')
const ObjectID = require('mongodb').ObjectID

describe('models/User', () => {
  let connection
  let lastUser

  beforeEach(async () => {
    connection = await Connection.connect()
    await connection.database.collection('users').removeMany({})

    const insertRes = await connection.database.collection('users').insertOne({
      apiKey: '1234-5678',
      username: 'test'
    })

    lastUser = insertRes.ops[0]
  })

  afterEach(async () => {
    __rewire_reset_all__()
    await connection.database.collection('users').removeMany({})
    await connection.client.close()
  })

  describe('.find', () => {
    it('should return a `User` instance', async () => {
      const user = await User.find(lastUser._id)
      expect(user).toBeInstanceOf(User)
    })

    it('should support passing the id as either an `ObjectID` or string', async () => {
      let user = await User.find(lastUser._id)
      expect(user).toBeInstanceOf(User)

      user = await User.find(lastUser._id.toString())
      expect(user).toBeInstanceOf(User)
    })

    it('should return null when a user cannot be found', async () => {
      const user = await User.find('AAAAAAAAAAAAAAAAAAAAAAAA')
      expect(user).toBeNull()
    })

    it('should populate the `id` property', async () => {
      const user = await User.find(lastUser._id)
      expect(user.id).toEqual(lastUser._id)
    })

    it('should populate the `apiKey` property', async () => {
      const user = await User.find(lastUser._id)
      expect(user.apiKey).toEqual(lastUser.apiKey)
    })

    it('should populate the `username` property', async () => {
      const user = await User.find(lastUser._id)
      expect(user.username).toEqual(lastUser.username)
    })
  })

  describe('.findByKey', () => {
    it('should return a `User` instance', async () => {
      const user = await User.findByKey(lastUser.apiKey)
      expect(user).toBeInstanceOf(User)
    })

    it('should return null when a user cannot be found', async () => {
      const user = await User.findByKey('AAAAAAAAAAAAAAAAAAAAAAAA')
      expect(user).toBeNull()
    })

    it('should populate the `id` property', async () => {
      const user = await User.findByKey(lastUser.apiKey)
      expect(user.id).toEqual(lastUser._id)
    })

    it('should populate the `apiKey` property', async () => {
      const user = await User.findByKey(lastUser.apiKey)
      expect(user.apiKey).toEqual(lastUser.apiKey)
    })

    it('should populate the `username` property', async () => {
      const user = await User.findByKey(lastUser.apiKey)
      expect(user.username).toEqual(lastUser.username)
    })
  })

  describe('#save', () => {
    describe('when `user.id` does not exist in the database', () => {
      it('should insert a new document', async () => {
        const user = new User()
        user.apiKey = 'upserted key'
        user.username = 'upserted_user'
        await user.save()

        const count = await connection
          .database
          .collection('users')
          .countDocuments({})

        expect(count).toEqual(2)
      })

      it('should store the new object ID in `user.id`', async () => {
        const user = new User()
        user.apiKey = 'upserted key'
        user.username = 'upserted_user'
        await user.save()

        const newUser = await connection
          .database
          .collection('users')
          .findOne({ username: 'upserted_user' })

        expect(user.id).toBeInstanceOf(ObjectID)
        expect(user.id).toEqual(newUser._id)
      })
    })

    describe('when `user.id` exists in the database', () => {
      it('should update the existing document', async () => {
        const user = await User.find(lastUser._id)
        user.username = 'updated'
        await user.save()

        expect(user.id).toEqual(lastUser._id)

        const totalCount = await connection
          .database
          .collection('users')
          .countDocuments({})

        expect(totalCount).toEqual(1)

        const updatedCount = await connection
          .database
          .collection('users')
          .countDocuments({ username: 'updated' })

        expect(updatedCount).toEqual(1)
      })
    })

    it('should return true on a successful save', async () => {
      const user = await User.find(lastUser._id)
      user.username = 'updated'
      const res = await user.save()
      expect(res).toBe(true)
    })

    it('should return false on an unsuccessful save', async () => {
      const MockedUser = require('./index')

      MockedUser.__set__({
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

      const user = new MockedUser()
      const res = await user.save()
      expect(res).toBe(false)
    })
  })

  describe('#setPassword', () => {
    it('should update the password in the user document', async () => {
      const user = await User.find(lastUser._id)
      await user.setPassword('ThisIsATest')

      const doc = await connection
        .database
        .collection('users')
        .findOne({ _id: user.id })

      const match = await bcrypt.compare('ThisIsATest', doc.password)
      expect(match).toBe(true)
    })

    it('should use the salt round count stored in the app config', async () => {
      const user = await User.find(lastUser._id)
      await user.setPassword('ThisIsATest')

      const doc = await connection
        .database
        .collection('users')
        .findOne({ _id: user.id })

      expect(doc.password).toMatch(/^\$2b\$04/)
    })

    it('should return true on a successful save', async () => {
      const user = await User.find(lastUser._id)
      const res = await user.setPassword('ThisIsATest')
      expect(res).toBe(true)
    })

    it('should return false on an unsuccessful save', async () => {
      const MockedUser = require('./index')

      MockedUser.__set__({
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

      const user = new MockedUser()
      const res = await user.setPassword('ThisIsATest')
      expect(res).toBe(false)
    })
  })
})
