const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, feedbackController.submitFeedback);
router.get('/', feedbackController.getAllFeedback);

module.exports = router;