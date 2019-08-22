const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

//  Load Post model
const Post = require('../../models/Post');
//  Load Profile model
const Profile = require('../../models/Profile');

// Validation
const validatePostInput = require('../../validation/post');

/**
 * @route   GET api/posts/test
 * @desc    Tests post route
 * @access  Pubic
 */
router.get('/test', (req, res) => res.json({ message: 'Posts Works' }));

/**
 * @route   GET api/posts
 * @desc    get post
 * @access  Public
 */
router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(post => res.json(post))
    .catch(err => res.status(404).json({ error: `No posts found${err.message}` }));
});

/**
 * @route   GET api/posts/:id
 * @desc    get post by Id
 * @access  Public
 */
router.get('/:id', (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({ error: `No post found with that Id. ${err.message}` }));
});

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

/**
 * @route   DELETE api/posts/:id
 * @desc    Delete post by Id
 * @access  Private
 */
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id }).then((profile) => {
    Post.findById(req.params.id)
      .then((post) => {
        // Check for post owner
        if (post.user.toString() !== req.user.id) {
          return res.status(401).json({ notauthorized: 'User not authorized' });
        }
        // Delete
        return post.remove().then(() => res.json({ success: true }));
      })
      .catch(err => res.status(404).json({ postnotfound: 'No Post Found' }, err));
  });
});
module.exports = router;
