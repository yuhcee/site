/* eslint-disable no-new */
const express = require('express');

const router = express.Router();
const passport = require('passport');
// Load validation
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

//  Load Profile Model
const Profile = require('../../models/Profile');

//  Load User Model
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
    .populate('user', ['name', 'avatar'])
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
 * @route   GET api/profile/all
 * @desc    Get allprofiles
 * @access  Public
 */
router.get('/all', (req, res) => {
  const errors = {};
  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then((profiles) => {
      if (!profiles) {
        errors.noprofiles = 'There are no profiles.';
        return res.status(404).json(errors);
      }
      res.status(200).json(profiles);
    })
    .catch((err) => {
      res.status(404).json({ profile: 'There are no profiles' }, err.message);
    });
});

/**
 * @route   GET api/profile/handle/:handle
 * @desc    Get profile by handle
 * @access  Public
 */

router.get('/handle/:handle', (req, res) => {
  const errors = {};
  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then((profile) => {
      if (!profile) {
        errors.noprofile = ' There is no profile for this user';
        res.status(404).json(errors);
      }

      res.status(200).json(profile);
    })
    .catch(err => res.status(404).json(err.message));
});

/**
 * @route   GET api/profile/user/:user_id
 * @desc    Get profile by user ID
 * @access  Public
 */

router.get('/user/:user_id', (req, res) => {
  const errors = {};
  Profile.findOne({ user: req.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then((profile) => {
      if (!profile) {
        errors.noprofile = ' There is no profile for this user';
        res.status(404).json(errors);
      }
      res.status(200).json(profile);
    })
    .catch(err => res.status(404).json(err.message));
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
        .catch(err => err.message);
    });
  });
});

/**
 * @route   POST api/profile/experience
 * @desc    Add experience to profile
 * @access  Private
 */
router.post('/experience', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateExperienceInput(req.body);

  // Check validation
  if (!isValid) {
    // Returns any errors with 400 status
    return res.status(400).json(errors);
  }
  Profile.findOne({ user: req.user.id }).then((profile) => {
    const {
      title, company, location, from, to, current, description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    // Add it to profile array
    profile.experience.unshift(newExp);

    profile.save().then(exp => res.json(exp));
  });
});

/**
 * @route   POST api/profile/education
 * @desc    Add education to profile
 * @access  Private
 */
router.post('/education', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateEducationInput(req.body);

  // Check validation
  if (!isValid) {
    // Returns any errors with 400 status
    return res.status(400).json(errors);
  }
  Profile.findOne({ user: req.user.id }).then((profile) => {
    const {
      school, degree, fieldofstudy, from, to, current, description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    // Add it to profile array
    profile.education.unshift(newEdu);

    profile.save().then(edu => res.json(edu));
  });
});

/**
 * @route   DELETE api/profile/experience
 * @desc    DELETE experience from profile
 * @access  Private
 */
router.delete(
  '/experience/:exp_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then((profile) => {
      // Get remove index
      const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

      //  Splice out of array
      profile.experience.splice(removeIndex, 1);

      // Save
      profile
        .save()
        .then(updateProfile => res.status(201).json(updateProfile))
        .catch(err => res.status(404).json({ err }));
    });
  },
);

/**
 * @route   DELETE api/profile/education
 * @desc    DELETE education from profile
 * @access  Private
 */
router.delete(
  '/education/:edu_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then((profile) => {
      // Get remove index
      const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

      //  Splice out of array
      profile.education.splice(removeIndex, 1);

      // Save
      profile
        .save()
        .then(updateProfile => res.status(201).json(updateProfile))
        .catch(err => res.status(404).json({ err }));
    });
  },
);

/**
 * @route   DELETE api/profile
 * @desc    DELETE user and profile
 * @access  Private
 */
router.delete('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOneAndRemove({ user: req.user.id }).then(() => {
    User.findOneAndRemove({ _id: req.user.id }).then(() => res.status(201).json({ success: true }));
  });
});

module.exports = router;
