const fs = require('fs')
const path = require('path')

class Config {
  static reload () {
    const configDirectory = path.join(__dirname, '../../config')
    const dbPath = path.join(configDirectory, `db.${process.env.NODE_ENV}.json`)
    const appPath = path.join(configDirectory, `app.${process.env.NODE_ENV}.json`)

    this._app = JSON.parse(fs.readFileSync(appPath))
    this._db = JSON.parse(fs.readFileSync(dbPath))
  }

  static get app () {
    if (!this._app) {
      Config.reload()
    }

    return this._app
  }

  static get db () {
    if (!this._db) {
      Config.reload()
    }

    return this._db
  }
}

module.exports = Config
