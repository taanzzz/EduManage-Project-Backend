const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

// Route to get homepage statistics
router.get('/stats', publicController.getHomepageStats);

// Route to get all feedback for the homepage carousel
router.get('/feedback', publicController.getAllFeedback);

module.exports = router;