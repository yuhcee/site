const express = require('express');

const router = express.Router();

/**
 * @route   GET api/users/test
 * @desc    Tests users route
 * @access  Pubic
 */
router.get('/test', (req, res) => res.json({ message: 'Users Works' }));

module.exports = router;
