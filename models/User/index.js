const bcrypt = require('bcrypt')

const Connection = require('>/lib/database/Connection')
const Config = require('>/lib/config')
const ObjectID = require('mongodb').ObjectID
const uuidv4 = require('uuid/v4')

class User {
  constructor () {
    this.id = new ObjectID()
    this.apiKey = uuidv4()
  }

  static async __find (criteria) {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('users')
    const doc = await collection.findOne(criteria)

    if (doc != null) {
      const user = new User()
      user.id = doc._id
      user.apiKey = doc.apiKey
      user.username = doc.username

      return user
    } else {
      return null
    }
  }

  static async find (id) {
    let oid = id
    if (!(id instanceof ObjectID)) {
      oid = new ObjectID(id)
    }

    return User.__find({ _id: oid })
  }

  static async findByKey (apiKey) {
    return User.__find({ apiKey: apiKey })
  }

  static async findByUsername (username) {
    return User.__find({ username: username })
  }

  async setPassword (password) {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('users')
    const hash = await bcrypt.hash(password, Config.app.password.salt_rounds)

    try {
      const res = await collection.updateOne({ _id: this.id }, {
        $set: {
          password: hash
        }
      })

      return res.modifiedCount === 1
    } catch (e) {
      return false
    }
  }

  async verifyPassword (password) {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('users')

    try {
      const doc = await collection.findOne({ _id: this.id })
      return bcrypt.compare(password, doc.password)
    } catch (e) {
      return false
    }
  }

  async save () {
    const connection = await Connection.connect()
    const collection = await connection.database.collection('users')

    try {
      const res = await collection.updateOne({ _id: this.id }, {
        $set: {
          apiKey: this.apiKey,
          username: this.username
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

module.exports = User
