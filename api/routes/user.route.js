const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, verifyAdmin } = require('../middlewares/auth.middleware');


router.get('/', verifyToken, verifyAdmin, userController.getAllUsers);
router.patch('/admin/:id', verifyToken, verifyAdmin, userController.makeAdmin);
router.get('/profile/:email', verifyToken, userController.getUserProfile);



router.patch('/profile/:email', verifyToken, userController.updateUserProfile);


module.exports = router;