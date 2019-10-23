const express = require('express')
const verifyHost = require('>/controllers/hosts').middleware.authenticate

const Rule = require('>/models/Rule')
const Setting = require('>/models/Setting')

module.exports = {}

async function getConfig (req, res, next) {
  try {
    const host = res.locals.host
    host.lastSeen = Date.now()
    await host.save()

    const rules = await Rule.all()
    const defaultAction = await Setting.find('defaultAction')
    const enableAnalytics = await Setting.find('enableAnalytics')

    res.send({
      success: true,
      data: {
        defaultAction: defaultAction.value,
        enableAnalytics: enableAnalytics.value,
        rules: rules.map(r => ({
          id: r.id.toString(),
          type: r.type,
          action: r.action,
          host: r.host
        }))
      }
    })
  } catch (e) {
    next(e)
  }
}

module.exports.bind = (app, mountPath = '/') => {
  const router = express.Router()
  router.route('/config').get(verifyHost, getConfig)
  app.use(mountPath, router)
}
