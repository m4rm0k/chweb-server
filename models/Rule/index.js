const Connection = require('>/lib/database/Connection')
const ObjectID = require('mongodb').ObjectID

class Rule {
  constructor () {
    this.id = new ObjectID()
  }

  static async __find (criteria) {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('rules')
    const doc = await collection.findOne(criteria)

    if (doc != null) {
      const rule = new Rule()
      rule.id = doc._id
      rule.type = doc.type
      rule.action = doc.action
      rule.host = doc.host

      return rule
    } else {
      return null
    }
  }

  static async find (id) {
    let oid = id
    if (!(id instanceof ObjectID)) {
      oid = new ObjectID(id)
    }

    return Rule.__find({ _id: oid })
  }

  static async delete (id) {
    let oid = id
    if (!(id instanceof ObjectID)) {
      oid = new ObjectID(id)
    }

    const connection = await Connection.connect()
    const collection = await connection.database.collection('rules')

    const res = await collection.deleteOne({ _id: oid })
    return res.deletedCount === 1
  }

  static async all () {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('rules')
    const docs = await collection.find({}).toArray()

    const rules = []
    for (let i = 0; i < docs.length; i++) {
      const rule = new Rule()
      rule.id = docs[i]._id
      rule.action = docs[i].action
      rule.type = docs[i].type
      rule.host = docs[i].host
      rules.push(rule)
    }

    return rules
  }

  async save () {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('rules')

    try {
      const res = await collection.updateOne({ _id: this.id }, {
        $set: {
          action: this.action,
          type: this.type,
          host: this.host
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

module.exports = Rule
