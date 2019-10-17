const Connection = require('>/lib/database/Connection')
const Setting = require('./index')

describe('models/Setting', () => {
  let connection

  beforeEach(async () => {
    connection = await Connection.connect()
    const collection = connection.database.collection('settings')
    await collection.removeMany({})
    await collection.insertOne({
      key: 'defaultAction',
      value: 'REJECT'
    })

    await collection.insertOne({
      key: 'enableAnalytics',
      value: true
    })
  })

  afterEach(async () => {
    __rewire_reset_all__()
    await connection.database.collection('settings').removeMany({})
    await connection.close()
  })

  describe('.find', () => {
    it('should return a `Setting` instance', async () => {
      const setting = await Setting.find('defaultAction')
      expect(setting).toBeInstanceOf(Setting)
    })

    it('should return null when a setting cannot be found', async () => {
      const setting = await Setting.find('AAAAAAAAAAAAAAAAAAAAAAAA')
      expect(setting).toBeNull()
    })

    it('should populate the `key` property', async () => {
      const setting = await Setting.find('defaultAction')
      expect(setting.key).toEqual('defaultAction')
    })

    it('should populate the `value` property', async () => {
      const setting = await Setting.find('defaultAction')
      expect(setting.value).toEqual('REJECT')
    })
  })

  describe('.all', () => {
    it('should return all settings', async () => {
      const res = await Setting.all()

      expect(res).toHaveLength(2)

      expect(res).toContainEqual({
        key: 'defaultAction',
        value: 'REJECT'
      })

      expect(res).toContainEqual({
        key: 'enableAnalytics',
        value: true
      })
    })
  })

  describe('#save', () => {
    describe('when `setting.key` does not exist in the database', () => {
      it('should insert a new document', async () => {
        const setting = new Setting()
        setting.key = 'newSetting'
        setting.value = 'new value'
        await setting.save()

        const count = await connection
          .database
          .collection('settings')
          .countDocuments({})

        expect(count).toEqual(3)
      })
    })

    describe('when `setting.key` exists in the database', () => {
      it('should update the existing document', async () => {
        const setting = await Setting.find('defaultAction')
        setting.value = 'updated'
        await setting.save()

        const totalCount = await connection
          .database
          .collection('settings')
          .countDocuments({ key: 'defaultAction' })

        expect(totalCount).toEqual(1)

        const updatedCount = await connection
          .database
          .collection('settings')
          .countDocuments({ value: 'updated' })

        expect(updatedCount).toEqual(1)
      })
    })

    it('should return true on a successful save', async () => {
      const setting = await Setting.find('defaultAction')
      setting.value = 'updated'
      const res = await setting.save()
      expect(res).toBe(true)
    })

    it('should return false on an unsuccessful save', async () => {
      const MockedSetting = require('./index')

      MockedSetting.__set__({
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

      const setting = new MockedSetting()
      const res = await setting.save()
      expect(res).toBe(false)
    })
  })
})
