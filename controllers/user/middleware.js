const Config = require('>/lib/config')
const User = require('>/models/User')

async function authenticate (req, res, next) {
  const apiKey = req.headers['x-api-key'] ||
                 req.query.apiKey ||
                 req.signedCookies[Config.app.cookie.name]

  const user = await User.findByKey(apiKey)

  if (user) {
    res.locals.user = user
    return next()
  } else {
    return res.status(401).end()
  }
}

module.exports = {
  authenticate: authenticate
}
