const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/create-payment-intent', verifyToken, paymentController.createPaymentIntent);

module.exports = router;