const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { verifyToken, verifyAdmin, verifyTeacher } = require('../middlewares/auth.middleware');


// Admin routes
router.get('/admin/all', verifyToken, verifyAdmin, classController.getAllClassesForAdmin);
router.patch('/admin/status/:id', verifyToken, verifyAdmin, classController.handleClassStatus);

// Teacher routes
router.get('/my-classes/:email', verifyToken, verifyTeacher, classController.getMyClasses);

// Public approved classes route
router.get('/approved', classController.getApprovedClasses); 

// Single class details (Dynamic route)
router.get('/:id', verifyToken, classController.getClassById); 

// Teacher routes
router.post('/', verifyToken, verifyTeacher, classController.addClass);
router.patch('/:id', verifyToken, verifyTeacher, classController.updateClass);
router.delete('/:id', verifyToken, verifyTeacher, classController.deleteClass);

module.exports = router;