/* eslint-disable no-new */
const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
// Load validation
const validateProfileInput = require('../../validation/profile');

//  Load Profile Model
const Profile = require('../../models/Profile');
// Load User Model
const User = require('../../models/User');

/**
 * @route   GET api/profile/test
 * @desc    Tests profile route
 * @access  Pubic
 */
router.get('/test', (req, res) => res.json({ message: 'Profile Works' }));

/**
 * @route   GET api/profile
 * @desc    Get current Users profile
 * @access  Private
 */
router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.user.id })
    .then((profile) => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }

      return res.status(200).json(profile);
    })
    .catch(err => res.status(404).json(err));
  // throw new Error(JSON.stringify({ foo: 'bar' }, null, 2));
});

/**
 * @route   POST api/profile
 * @desc    Create or Edit user  profile
 * @access  Private
 */
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateProfileInput(req.body);

  // Check validation
  if (!isValid) {
    // Returns any errors with 400 status
    return res.status(400).json(errors);
  }
  // Get fields
  const profileFields = {};
  profileFields.user = req.user.id;
  const {
    handle,
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    twitter,
    facebook,
    linkedin,
    instagram,
  } = req.body;

  if (handle) profileFields.handle = handle;
  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubusername) profileFields.githubusername = githubusername;
  // Split -> Skills into an array
  if (typeof skills !== 'undefined') profileFields.skills = skills.split(',');
  // Socials
  profileFields.social = {};
  if (youtube) profileFields.social.youtube = youtube;
  if (twitter) profileFields.social.twitter = twitter;
  if (facebook) profileFields.social.facebook = facebook;
  if (linkedin) profileFields.social.linkedin = linkedin;
  if (instagram) profileFields.social.instagram = instagram;

  Profile.findOne({ user: req.user.id }).then((profile) => {
    if (profile) {
      // Update
      Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true }).then(
        // console.log('HEEEERRRRRRREEEEE'),
        updatedProfile => res.json(updatedProfile),
      );
    }
    // Create
    // Check if handle exists
    Profile.findOne({ handle: profileFields.handle }).then((profileHandle) => {
      if (profileHandle) {
        errors.handle = 'This handle already exists';
        res.status(400).json(errors);
      }

      // Save Profile
      new Profile(profileFields)
        .save()
        .then(savedProfile => res.json(savedProfile))
        .catch((err) => {
          console.log(err.message);
        });
    });
  });
});

module.exports = router;
