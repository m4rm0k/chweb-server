const express = require('express')
const verifyUser = require('>/controllers/user').middleware.authenticate

const Setting = require('>/models/Setting')

module.exports = {}

async function getSettings (req, res, next) {
  try {
    const settings = await Setting.all()
    const data = {}

    for (let i = 0; i < settings.length; i++) {
      data[settings[i].key] = settings[i].value
    }

    return res.send({
      success: true,
      data
    })
  } catch (e) {
    return next(e)
  }
}

async function getSetting (req, res, next) {
  try {
    const setting = await Setting.find(req.params.key)

    if (setting) {
      return res.send({
        success: true,
        data: setting.value
      })
    } else {
      return res.status(404).send({ success: false })
    }
  } catch (e) {
    return next(e)
  }
}

async function saveSetting (req, res, next) {
  if (!Array.isArray(req.body)) {
    return res.status(400).send({ success: false })
  }

  try {
    for (let i = 0; i < req.body.length; i++) {
      const setting = await Setting.find(req.body[i].key)
      if (setting) {
        setting.value = req.body[i].value
        await setting.save()
      }
    }

    return res.send({ success: true })
  } catch (e) {
    return next(e)
  }
}

module.exports.bind = (app, mountPath = '/') => {
  const router = express.Router()

  router.route('/')
    .get(verifyUser, getSettings)
    .post(verifyUser, saveSetting)

  router.route('/:key')
    .get(verifyUser, getSetting)

  app.use(mountPath, router)
}
