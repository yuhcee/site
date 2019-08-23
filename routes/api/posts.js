/* eslint-disable no-underscore-dangle */
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
 * @route   POST api/posts
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

/**
 * @route   POST api/posts/like/:id
 * @desc    Like post
 * @access  Private
 */
router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id }).then((profile) => {
    Post.findById(req.params.id)
      .then((post) => {
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
          return res.status(400).json({ alreadyliked: 'User already liked this post.' });
        }
        //  Add the user id to the Likes array
        post.likes.unshift({ user: req.user.id });
        return post.save().then(likedPost => res.json(likedPost));
      })
      .catch(err => res.status(404).json({ postnotfound: 'No Post Found' }, err));
  });
});

/**
 * @route   POST api/posts/unlike/:id
 * @desc    Unlike post
 * @access  Private
 */
router.post('/unlike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id }).then((profile) => {
    Post.findById(req.params.id)
      .then((post) => {
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
          return res.status(400).json({ notliked: 'You have no liked this post.' });
        }
        // Get remove Index
        const removeIndex = post.likes.map(item => item.user.toString()).indexOf(req.user.id);
        //  Splice the user id out of the Likes array
        post.likes.splice(removeIndex, 1);
        return post.save().then(unLikedPost => res.json(unLikedPost));
      })
      .catch(err => res.status(404).json({ postnotfound: 'No Post Found' }, err));
  });
});

/**
 * @route   POST api/posts/comment/:id
 * @desc    Add comment to post
 * @access  Private
 */
router.post('/comment/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validatePostInput(req.body);
  //  Check Validation
  if (!isValid) {
    //  If any errors, send 400 with errors object
    return res.status(400).json(errors);
  }
  const { text, name, avatar } = req.body;
  Post.findById(req.params.id).then((post) => {
    const newComment = {
      text,
      name,
      avatar,
      user: req.user.id,
    };
    //  Add into comments Array
    post.comments.unshift(newComment);
    // Save
    post
      .save()
      .then(createdComment => res.json(createdComment))
      .catch(err => res.status(404).json({ postnotfound: 'No Post Found' }, err));
  });
});

/**
 * @route   POST api/posts/comment/:id/:comment_id
 * @desc    Remove comment from post
 * @access  Private
 */
router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then((post) => {
        //  Check if comment exists
        if (
          post.comments.filter(comment => comment._id.toString() === req.params.comment_id)
            .length === 0
        ) {
          return res.status(404).json({ commentnotexists: 'Comment does not exist' });
        }
        //  Get the remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        //  Splice out of the array
        post.comments.splice(removeIndex, 1);

        post.save().then(posts => res.json(posts));
      })
      .catch(err => res.status(404).json(err));
  },
);
module.exports = router;
