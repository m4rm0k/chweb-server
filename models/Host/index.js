const Connection = require('>/lib/database/Connection')
const ObjectID = require('mongodb').ObjectID

class Host {
  constructor () {
    this.id = new ObjectID()
  }

  static async __find (criteria) {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('hosts')
    const doc = await collection.findOne(criteria)

    if (doc != null) {
      const host = new Host()
      host.id = doc._id
      host.apiKey = doc.apiKey
      host.name = doc.name

      return host
    } else {
      return null
    }
  }

  static async find (id) {
    let oid = id
    if (!(id instanceof ObjectID)) {
      oid = new ObjectID(id)
    }

    return Host.__find({ _id: oid })
  }

  static async findByKey (apiKey) {
    return Host.__find({ apiKey: apiKey })
  }

  async save () {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('hosts')

    try {
      const res = await collection.updateOne({ _id: this.id }, {
        $set: {
          apiKey: this.apiKey,
          name: this.name
        }
      }, { upsert: true })

      if (res.upsertedId) {
        this.id = res.upsertedId._id
      }

      return true
    } catch (e) {
      return false
    }
  }
}

module.exports = Host
