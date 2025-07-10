const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

// Route to get homepage statistics
router.get('/stats', publicController.getHomepageStats);


module.exports = router;