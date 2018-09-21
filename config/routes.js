const axios = require('axios');
const server = require('../server.js')
const { authenticate } = require('./middlewares');
const bcrypt = require('bcryptjs');
const knex = require('knex');
const knexConfig = require('../knexfile.js')
const db = knex(knexConfig.development);
const jwt = require('jsonwebtoken');
const secret = require('../_secrets/keys').jwtKey;

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function generateToken(user) {
    
  const payload = {
      username: user.username
  }

  const options = {
      expiresIn: '1h',
      jwtid: '56789',
  };

  return jwt.sign(payload, secret, options);
}

function register(req, res) {
    const creds = req.body;
    const hash = bcrypt.hashSync(creds.password, 4);
    creds.password = hash;
  
    db("users")
      .insert(creds)
      .then(ids => {
        const id = ids[0];
        res.status(201).json(id);
      })
}

function login(req, res) {
  const creds = req.body;
  db("users")
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        const token = generateToken(user.username)
        res.status(200).send({token});
      } else {
        res.status(401).json({ message: "Username or password is incorrect" });
      }
    })
    .catch(err => res.status(500).send(err))
}

function getJokes(req, res) {
  axios
    .get(
      'https://08ad1pao69.execute-api.us-east-1.amazonaws.com/dev/random_ten'
    )
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}
