const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const { verifyToken, verifyTeacher } = require('../middlewares/auth.middleware');


router.get('/class/:classId', verifyToken, assignmentController.getAssignmentsForClass);


router.post('/', verifyToken, verifyTeacher, assignmentController.createAssignment);

module.exports = router;