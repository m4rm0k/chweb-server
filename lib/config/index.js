const fs = require('fs')
const path = require('path')

class Config {
  static reload () {
    try {
      const configDirectory = path.join(__dirname, '../../config')
      this._dbPath = path.join(configDirectory, `db.${process.env.NODE_ENV}.json`)
      this._appPath = path.join(configDirectory, `app.${process.env.NODE_ENV}.json`)

      this._app = JSON.parse(fs.readFileSync(this._appPath))
      this._db = JSON.parse(fs.readFileSync(this._dbPath))
      this._exists = true
    } catch (e) {
      this._exists = false
    }
  }

  static get exists () {
    if (this._exists === undefined) {
      Config.reload()
    }

    return this._exists
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

  static path (file) {
    if (file === 'app') {
      return this._appPath
    } else if (file === 'db') {
      return this._dbPath
    }
  }
}

module.exports = Config
