const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

//  Post model
const Post = require('../../models/Post');

// Validation
const validatePostInput = require('../../validation/post');

/**
 * @route   GET api/posts/test
 * @desc    Tests post route
 * @access  Pubic
 */
router.get('/test', (req, res) => res.json({ message: 'Posts Works' }));

/**
 * @route   POST api/posts/test
 * @desc    Create post
 * @access  Private
 */

router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validatePostInput(req.body);
  //  Check Validation
  if (!isValid) {
    //  If any errors, send 400 with errors object
    return res.status(400).json(errors);
  }

  const { text, name, avatar } = req.body;
  const newPost = new Post({
    text,
    name,
    avatar,
    user: req.user.id,
  });

  return newPost.save().then(post => res.json(post));
});

module.exports = router;
