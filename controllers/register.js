const jwt = require('jsonwebtoken')
const redisClient = require('./signin').redisClient

const signToken = (email) => {
  const jwtPayload = { email }
  return jwt.sign(jwtPayload, 'secret')
}

const setToken = (key, value) => {
  return Promise.resolve(
    redisClient.set(key, value)
  )
}

const createSessions = user => {
  // JWT token
  const { email, id } = user
  const token = signToken(email)
  // return user data
  return setToken(token, id)
    .then(() => {
      return {success: 'true', userId: id, token}
      })
    .catch(console.log)
}

const handleRegister = (req, res, db, bcrypt) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json('incorrect form submission');
  }
  
  const hash = bcrypt.hashSync(password);
  return db.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {
      return trx('users')
        .returning('*')
        .insert({
          email: loginEmail[0],
          name: name,
          joined: new Date()
        })
        .then(user => {
          return user[0]
        })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => Promise.reject('error while creating user'))
}

const registerAuth = (req, res, db, bcrypt) => {
  return handleRegister(req, res, db, bcrypt)
    .then(data => data.id && data.email ? createSessions(data) : res.status(400).json("error"))  
    .then(session => res.json(session))
    .catch(err => res.status(400).json("Error: " + err))
}

module.exports = {
  registerAuth: registerAuth
};


