const Counter = require('>/models/Counter')
const Host = require('>/models/Host')
const express = require('express')
const verifyUser = require('>/controllers/user').middleware.authenticate
const verifyHost = require('>/controllers/hosts').middleware.authenticate

async function getCounters (req, res, next) {
  const counters = {}
  const globalCounter = await Counter.find('<all>')

  counters.global = {
    allowed: globalCounter.allowed,
    blocked: globalCounter.blocked
  }

  const mostBlocked = await Counter.all({
    sort: {
      blocked: -1
    },
    limit: 5
  })

  counters.mostBlocked = mostBlocked.map(c => {
    return {
      host: c.host,
      allowed: c.allowed,
      blocked: c.blocked
    }
  })

  const mostAllowed = await Counter.all({
    sort: {
      allowed: -1
    },
    limit: 5
  })

  counters.mostAllowed = mostAllowed.map(c => {
    return {
      host: c.host,
      allowed: c.allowed,
      blocked: c.blocked
    }
  })

  const hosts = await Host.all()
  counters.hosts = hosts.map(h => {
    return {
      name: h.name,
      allowed: h.counter.allowed,
      blocked: h.counter.blocked
    }
  })

  return res.send({
    success: true,
    data: { counters }
  })
}

async function updateCounters (req, res, next) {
  if (!req.body.action || !req.body.host) {
    return res.status(400).send()
  }

  const { action, host } = req.body
  const globalCounter = await Counter.find('<all>')
  const hostCounter = await Counter.find(host)

  await globalCounter.increment({ action })
  await hostCounter.increment({ action })
  await res.locals.host.incrementCounter({ action })

  return res.send({ success: true })
}

module.exports = {}
module.exports.bind = (app, mountPath = '/') => {
  const router = express.Router()

  router.route('/')
    .get(verifyUser, getCounters)
    .post(verifyHost, updateCounters)

  app.use(mountPath, router)
}
