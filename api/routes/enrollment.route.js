const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const { verifyToken } = require('../middlewares/auth.middleware');


router.post('/confirm', verifyToken, enrollmentController.confirmEnrollment);

router.get('/my-classes/:email', verifyToken, enrollmentController.getMyEnrolledClasses);

module.exports = router;