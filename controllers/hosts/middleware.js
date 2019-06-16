const Host = require('>/models/Host')

async function authenticate (req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey
  const host = await Host.findByKey(apiKey)

  if (host) {
    res.locals.host = host
    return next()
  } else {
    return res.status(401).end()
  }
}

module.exports = {
  authenticate: authenticate
}
