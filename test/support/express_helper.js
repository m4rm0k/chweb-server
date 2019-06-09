const config = require('../../lib/config')
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

function create () {
  let app = express()
  app.use(bodyParser.json())
  app.use(cookieParser(config.app.cookie.secret))

  app.get('/set-cookie', (req, res) => {
    const day = 60 * 60 * 24 * 1000
    let expirationDate = new Date()
    expirationDate.setUTCHours(0, 0, 0, 0)
    expirationDate = new Date(expirationDate.getTime() + (day * 30))

    res.cookie(req.query.name, req.query.value, {
      expires: req.query.expires ? expirationDate : false,
      httpOnly: true,
      signed: true
    })

    res.send({})
  })
  return app
}

module.exports = {
  create: create
}
