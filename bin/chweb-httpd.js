#! /usr/bin/env node

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development'
}

const bodyParser = require('body-parser')
const config = require('>/lib/config')
const cookieParser = require('cookie-parser')
const express = require('express')
const helmet = require('helmet')
const staticRouter = require('>/controllers/static')

const app = express()
const controllerNames = [
  'client',
  'hosts',
  'rules',
  'user',
  'settings',
  'analytics'
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
  if (config.app.gid) {
    process.setgid(config.app.gid)
    console.log(`Changed egid to ${config.app.gid}`)
  }

  if (config.app.uid) {
    process.setuid(config.app.uid)
    console.log(`Changed euid to ${config.app.uid}`)
  }

  app.use(helmet())
  app.use(cookieParser(config.app.cookie.secret))
  app.use(bodyParser.json())

  for (const name of controllerNames) {
    const controller = require(`>/controllers/${name}`)
    controller.bind(app, `/api/v1/${name}`)
  }

  staticRouter.bind(app)
  bindErrorHandler(app)

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
