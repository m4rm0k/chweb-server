const { Connection } = require('>/lib/database')

class Counter {
  constructor () {
    this.host = ''
    this.allowed = 0
    this.blocked = 0
  }

  static async find (host) {
    const connection = await Connection.connect()
    const doc = await connection
      .database
      .collection('counters')
      .findOne({ host })

    const counter = new Counter()
    counter.host = host

    if (doc != null) {
      counter.allowed = doc.allowed
      counter.blocked = doc.blocked
    }

    return counter
  }

  static async all ({ sort = { host: 1 }, limit = 0 } = {}) {
    const counters = []
    const connection = await Connection.connect()
    const docs = await connection
      .database
      .collection('counters')
      .find({
        host: {
          $ne: '<all>'
        }
      }, {
        sort,
        limit
      })
      .toArray()

    for (let i = 0; i < docs.length; i++) {
      const counter = new Counter()
      counter.host = docs[i].host
      counter.allowed = docs[i].allowed
      counter.blocked = docs[i].blocked
      counters.push(counter)
    }

    return counters
  }

  async save () {
    const connection = await Connection.connect()

    try {
      await connection
        .database
        .collection('counters')
        .updateOne({ host: this.host }, {
          $set: {
            host: this.host,
            allowed: this.allowed,
            blocked: this.blocked
          }
        }, { upsert: true })

      return true
    } catch (e) {
      return false
    }
  }

  async increment ({ action }) {
    const connection = await Connection.connect()

    try {
      await connection
        .database
        .collection('counters')
        .updateOne({ host: this.host }, {
          $inc: {
            allowed: action === 'allowed' ? 1 : 0,
            blocked: action === 'blocked' ? 1 : 0
          }
        }, { upsert: true })

      return true
    } catch (e) {
      return false
    }
  }
}

module.exports = Counter
