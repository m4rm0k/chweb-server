const config = require('>/lib/config')
const express = require('express')
const middleware = require('./middleware')

const User = require('>/models/User')

function sendSessionCookie (res, apiKey, rememberMe = false) {
  const day = 60 * 60 * 24 * 1000
  let expirationDate = new Date()
  expirationDate.setUTCHours(0, 0, 0, 0)
  expirationDate = new Date(expirationDate.getTime() + (day * 30))

  res.cookie(config.app.cookie.name, apiKey, {
    expires: rememberMe ? expirationDate : false,
    httpOnly: true,
    signed: true
  })
}

async function authenticate (req, res, next) {
  try {
    if (!req.body.username || !req.body.password) {
      return res.send({
        success: false
      })
    }

    const user = await User.findByUsername(req.body.username)
    const authenticated = await user.verifyPassword(req.body.password)

    if (!authenticated) {
      return res.send({
        success: false
      })
    }

    sendSessionCookie(res, user.apiKey, req.body.rememberMe)
    return res.send({
      success: true
    })
  } catch (e) {
    return next(e)
  }
}

function getUser (req, res, next) {
  return res.send({
    success: true,
    data: res.locals.user
  })
}

function bind (app) {
  const router = express.Router()

  router.route('/')
    .get(middleware.authenticate, getUser)

  router.route('/authenticate')
    .post(authenticate)

  app.use('/api/v1/user', router)
}

module.exports = {
  bind: bind,
  middleware: middleware
}
