const redisClient = require('./signin').redisClient

const removeToken = (token) => {
  redisClient.del(token)
}

const handleSignout = (req, res) => {
  const { authorization } = req.headers

  if(getAuthTokenId(req, res)) {
    removeToken(authorization)
  }
}

const getAuthTokenId = (req, res) => {
  const { authorization } = req.headers
  return redisClient.get(authorization, (err, reply) => {
    if(err || !reply) {
      return res.status(400).json("Unauthorized")
    }
    return res.json({id: reply})
  })
}

module.exports = {
  handleSignout
}