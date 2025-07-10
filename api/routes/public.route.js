const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');


// Route to get homepage statistics
router.get('/stats', publicController.getHomepageStats);

// Route to get all feedback for the homepage carousel
router.get('/feedback', publicController.getAllFeedback);

router.get('/popular-classes', publicController.getPopularClasses);

router.get('/banners', publicController.getActiveBanners);

module.exports = router;