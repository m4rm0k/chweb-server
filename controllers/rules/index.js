const express = require('express')
const verifyUser = require('>/controllers/user').middleware.authenticate

const ObjectId = require('mongodb').ObjectId
const Rule = require('>/models/Rule')

async function getRules (req, res, next) {
  try {
    const rules = await Rule.all()

    res.send({
      success: true,
      data: rules.map(r => ({
        id: r.id.toString(),
        type: r.type,
        action: r.action,
        host: r.host
      }))
    })
  } catch (e) {
    next(e)
  }
}

async function getRule (req, res, next) {
  try {
    const rule = await Rule.find(req.params.id)

    if (!rule) {
      return res.status(404).send()
    } else {
      return res.send({
        success: true,
        data: {
          id: rule.id.toString(),
          type: rule.type,
          action: rule.action,
          host: rule.host
        }
      })
    }
  } catch (e) {
    next(e)
  }
}

async function createRule (req, res, next) {
  try {
    const body = req.body
    if (!body.action || !body.host || !body.type) {
      return res.status(400).send({
        success: false
      })
    }

    const rule = new Rule()
    rule.action = body.action
    rule.host = body.host
    rule.type = body.type
    await rule.save()

    res.send({
      success: true,
      data: rule
    })
  } catch (e) {
    next(e)
  }
}

async function deleteRule (req, res, next) {
  if (!req.params.id) {
    return res.status(404).send({
      success: false
    })
  }

  let id = null

  try {
    id = new ObjectId(req.params.id)
  } catch (e) {
    return res.status(400).send({
      success: false
    })
  }

  try {
    return res.send({
      success: await Rule.delete(id)
    })
  } catch (e) {
    return next(e)
  }
}

async function updateRules (req, res, next) {
  try {
    let rules

    if (Array.isArray(req.body)) {
      rules = req.body
    } else {
      rules = [req.body]
    }

    const updatedRules = []
    for (let i = 0; i < rules.length; i++) {
      const rule = new Rule()
      rule.id = new ObjectId(rules[i].id)
      rule.action = rules[i].action
      rule.type = rules[i].type
      rule.host = rules[i].host

      const isInvalid = !rule.id ||
                        !rule.action ||
                        !rule.type ||
                        !rule.host

      if (isInvalid) {
        return res.status(400).send({
          success: false
        })
      }

      await rule.save()

      updatedRules.push(rule)
    }

    return res.send({
      success: true,
      data: updatedRules
    })
  } catch (e) {
    return next(e)
  }
}

function bind (app, mountPath = '/') {
  const router = express.Router()

  router.route('/')
    .get(verifyUser, getRules)
    .put(verifyUser, createRule)
    .post(verifyUser, updateRules)

  router.route('/:id')
    .get(verifyUser, getRule)
    .delete(verifyUser, deleteRule)

  app.use(mountPath, router)
}

module.exports = {
  bind: bind
}
