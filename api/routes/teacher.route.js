const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const { verifyToken, verifyAdmin } = require('../middlewares/auth.middleware');

router.post('/apply', verifyToken, teacherController.applyForTeaching);
router.get('/requests', verifyToken, verifyAdmin, teacherController.getTeacherRequests);
router.patch('/requests/:id', verifyToken, verifyAdmin, teacherController.handleTeacherRequest);

module.exports = router;