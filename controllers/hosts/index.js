const express = require('express')
const middleware = require('./middleware')
const verifyUser = require('>/controllers/user').middleware.authenticate

const Host = require('>/models/Host')

async function getHosts (req, res, next) {
  try {
    return res.send({
      success: true,
      data: await Host.all()
    })
  } catch (e) {
    return next(e)
  }
}

async function createHost (req, res, next) {
  try {
    const body = req.body

    if (!body.name) {
      return res.status(400).send({
        success: false
      })
    }

    const host = new Host()
    host.name = body.name
    await host.save()

    return res.send({
      success: true,
      data: host
    })
  } catch (e) {
    return next(e)
  }
}

async function updateHost (req, res, next) {
  try {
    const body = req.body

    if (!body.id || !body.name) {
      return res.status(400).send({
        success: false
      })
    }

    const host = await Host.find(body.id)
    host.name = body.name
    await host.save()

    return res.send({
      success: true,
      data: host
    })
  } catch (e) {
    return next(e)
  }
}

async function deleteHost (req, res, next) {
  try {
    return res.send({
      success: await Host.delete(req.params.id)
    })
  } catch (e) {
    return next(e)
  }
}

function bind (app) {
  const router = express.Router()

  router.route('/')
    .get(verifyUser, getHosts)
    .put(verifyUser, createHost)
    .post(verifyUser, updateHost)

  router.route('/:id')
    .delete(verifyUser, deleteHost)

  app.use('/api/v1/hosts', router)
}

module.exports = {
  bind: bind,
  middleware: middleware
}
