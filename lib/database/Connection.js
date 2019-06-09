const config = require('../config')
const collection = require('./collection')
const MongoClient = require('mongodb').MongoClient

function buildUrl (opts) {
  if (opts.anonymous) {
    return `mongodb://${opts.host}:${opts.port}/${opts.database}`
  } else {
    return `mongodb://${opts.username}:${opts.password}@${opts.host}:${opts.port}/${opts.database}`
  }
}

class Connection {
  static checkConnection () {
    return new Promise((resolve, reject) => {
      if (!this.connection) {
        return resolve(false)
      }

      this.connection.database.listCollections().toArray((error) => {
        return resolve(!error)
      })
    })
  }

  static async initialise (db) {
    await collection.createCollection(db, 'users')
    await collection.createCollection(db, 'hosts')
    await collection.createCollection(db, 'rules')
    await collection.createCollection(db, 'settings')
  }

  static connect () {
    return new Promise(async (resolve, reject) => {
      if (this.connection && await Connection.checkConnection()) {
        return resolve(this.connection)
      }

      let url = buildUrl(config.db)
      MongoClient.connect(url, { useNewUrlParser: true }, async (error, client) => {
        if (error || !client) {
          console.log('Failed to connect to mongodb')
          throw error
        }

        this.connection = {
          client: client,
          database: await client.db(config.db.database)
        }

        await Connection.initialise(this.connection.database)
        return resolve(this.connection)
      })
    })
  }
}

module.exports = Connection