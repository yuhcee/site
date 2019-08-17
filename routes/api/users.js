const express = require('express');

const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { key } = require('../../config/keys');
// Load User model
const User = require('../../models/User');

/**
 * @route   GET api/users/test
 * @desc    Tests users route
 * @access  Pubic
 */
router.get('/test', (req, res) => res.json({ message: 'Users Works' }));

/**
 * @route   GET api/users/register
 * @desc    Register user
 * @access  Pubic
 */
router.post('/register', (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    try {
      if (user) {
        return res.status(400).json({ email: 'Email already exists.' });
      }
      const { name, email, password } = req.body;
      const avatar = gravatar.url(email, {
        s: '200', // size
        r: 'pg', // rating
        d: 'mm', // default
      });
      const newUser = new User({
        name,
        email,
        avatar,
        password,
      });

      return bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (error, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser.save().then(createdUser => res.status(200).json(createdUser));
        });
      });
    } catch (error) {
      throw new Error({ error });
    }
  });
});

/**
 * @route   GET api/users/login
 * @desc    Login user / Returning JWT token
 * @access  Pubic
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  User.findOne({ email }).then((user) => {
    //  Check for user
    if (!user) {
      return res.status(404).json({
        email: 'User not found',
      });
    }
    //  Check password
    return bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        // User matched
        const { id, name, avatar } = user;
        // Create Jwt payload
        const payload = { id, name, avatar };

        // Sign Token
        jwt.sign(
          payload,
          key,

          {
            expiresIn: '1h',
          },
          (err, token) => {
            res.json({
              success: true,
              token: `Bearer ${token}`,
            });
          },
        );
      } else {
        res.status(400).json({ password: 'Password does not match' });
      }
    });
  });
});

/**
 * @route   GET api/users/current
 * @desc    Returns current user
 * @access  Private
 */
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {
  const {
    id, name, email, avatar,
  } = req.user;
  res.json({
    id, name, email, avatar,
  });
});
module.exports = router;
