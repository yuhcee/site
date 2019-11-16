const express = require('express');

const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { key } = require('../../config/keys');

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// Load User model
const User = require('../../models/User');

/**
 * @route   GET api/users/test
 * @desc    Tests users route
 * @access  Pubic
 */
router.get('/test', (req, res) => res.json({ message: 'Users Works' }));

/**
 * @route   POST api/users/register
 * @desc    Register user
 * @access  Pubic
 */
router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    try {
      if (user) {
        errors.email = 'Email already exists.';
        return res.status(400).json(errors);
      }
      const { name, email, password } = req.body;
      const avatar = gravatar.url(email, {
        s: '200', // size
        r: 'pg', // rating
        d: 'mm' // default
      });
      const newUser = new User({
        name,
        email,
        avatar,
        password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (error, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser.save().then(createdUser => res.json(createdUser));
        });
      });
    } catch (error) {
      console.log(error);
    }
  });
});

/**
 * @route   POST api/users/login
 * @desc    Login user / Returning JWT token
 * @access  Pubic
 */
router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const { email, password } = req.body;
  // Find user by email
  return User.findOne({ email }).then(user => {
    //  Check for user
    if (!user) {
      errors.email = ' User not found';
      return res.status(404).json(errors);
    }
    //  Check password
    return bcrypt.compare(password, user.password).then(isMatch => {
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
            expiresIn: '1h'
          },
          (err, token) => {
            res.json({
              success: true,
              token: `Bearer ${token}`
            });
          }
        );
      } else {
        errors.password = 'Password is incorrect';
        res.status(400).json(errors);
      }
    });
  });
});

/**
 * @route   GET api/users/current
 * @desc    Returns current user
 * @access  Private
 */
router.get(
  '/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { id, name, email, avatar } = req.user;
    res.json({
      id,
      name,
      email,
      avatar
    });
  }
);
module.exports = router;
