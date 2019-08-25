const express = require('express')
const fs = require('fs')
const path = require('path')
const reactIndex = path.join(__dirname, '../../public/app/build/index.html')

function getBuildPath () {
  return path.join(__dirname, '../../public/app/build')
}

function serveReactApp (req, res, next) {
  fs.readFile(reactIndex, (error, data) => {
    if (error) {
      return res.status(500).end()
    } else {
      return res.send(data.toString())
    }
  })
}

function bind (app) {
  let router = express.Router()
  app.use('/', router)
  app.use(express.static(getBuildPath()))

  router.route('/').get((req, res, next) => {
    res.redirect('/app')
  })

  router.route('/login').get(serveReactApp)
  router.route('/app').get(serveReactApp)
  router.route('/app*').get(serveReactApp)
}

module.exports = {
  bind: bind
}
