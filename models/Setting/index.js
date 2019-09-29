const Connection = require('>/lib/database/Connection')

class Setting {
  static async find (key) {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('settings')
    const doc = await collection.findOne({ key: key })

    if (doc != null) {
      const setting = new Setting()
      setting.key = doc.key
      setting.value = doc.value

      return setting
    } else {
      return null
    }
  }

  static async all () {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('settings')
    const docs = await collection.find().toArray()

    return docs.map(d => {
      const setting = new Setting()
      setting.key = d.key
      setting.value = d.value
      return setting
    })
  }

  async save () {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('settings')

    try {
      await collection.updateOne({ key: this.key }, {
        $set: {
          key: this.key,
          value: this.value
        }
      }, { upsert: true })

      return true
    } catch (e) {
      return false
    }
  }
}

module.exports = Setting
