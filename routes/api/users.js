const express = require('express');

const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');

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

module.exports = router;
