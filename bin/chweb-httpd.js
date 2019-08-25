#! /usr/bin/env node

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development'
}

const bodyParser = require('body-parser')
const config = require('>/lib/config')
const cookieParser = require('cookie-parser')
const express = require('express')
const helmet = require('helmet')

const app = express()
const controllerNames = [
  'hosts',
  'rules',
  'user',
  'static'
]

function bindErrorHandler (app) {
  app.use((error, req, res, next) => {
    console.error(error)
    res.status(500).send({
      success: false
    })
  })
}

function start () {
  app.use(helmet())
  app.use(cookieParser(config.app.cookie.secret))
  app.use(bodyParser.json())

  for (let name of controllerNames) {
    const controller = require(`>/controllers/${name}`)
    controller.bind(app)
  }

  return app.listen(config.app.bind_port)
}

if (require.main === module) {
  start()
}

module.exports = {
  app: app,
  start: start,
  bindErrorHandler: bindErrorHandler
}
