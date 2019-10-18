const Connection = require('>/lib/database/Connection')
const ObjectID = require('mongodb').ObjectID
const uuidv4 = require('uuid/v4')

class Host {
  constructor () {
    this.id = new ObjectID()
    this.apiKey = uuidv4()
    this.counter = {
      allowed: 0,
      blocked: 0
    }
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
      host.lastSeen = doc.lastSeen

      if (doc.counter) {
        host.counter = doc.counter
      }

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

  static async all () {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('hosts')
    const docs = await collection.find({}).toArray()

    const hosts = []
    for (let i = 0; i < docs.length; i++) {
      const host = new Host()
      host.id = docs[i]._id
      host.name = docs[i].name
      host.apiKey = docs[i].apiKey
      host.lastSeen = docs[i].lastSeen

      if (docs[i].counter) {
        host.counter = docs[i].counter
      }

      hosts.push(host)
    }

    return hosts
  }

  static async delete (id) {
    let oid = id
    if (!(id instanceof ObjectID)) {
      oid = new ObjectID(id)
    }

    const connection = await Connection.connect()
    const collection = await connection.database.collection('hosts')

    const res = await collection.deleteOne({ _id: oid })
    return res.deletedCount === 1
  }

  async save () {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('hosts')

    try {
      const res = await collection.updateOne({ _id: this.id }, {
        $set: {
          apiKey: this.apiKey,
          name: this.name,
          lastSeen: this.lastSeen,
          counter: this.counter
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

  async incrementCounter ({ action }) {
    const connection = await Connection.connect()

    try {
      await connection
        .database
        .collection('hosts')
        .updateOne({ _id: this.id }, {
          $inc: {
            'counter.allowed': action === 'allowed' ? 1 : 0,
            'counter.blocked': action === 'blocked' ? 1 : 0
          }
        })

      return true
    } catch (e) {
      return false
    }
  }
}

module.exports = Host
