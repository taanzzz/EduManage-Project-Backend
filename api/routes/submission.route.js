const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const { verifyToken, verifyTeacher } = require('../middlewares/auth.middleware');

router.post('/', verifyToken, submissionController.submitAssignment);


router.get('/class/:classId', verifyToken, verifyTeacher, submissionController.getSubmissionsForClass);

module.exports = router;