import express from 'express';
import db from '../database.js';

const router = express.Router();

// Process payment
router.post('/process', async (req, res) => {
  try {
    const {
      registrationId,
      amount,
      paymentMethod,
      cardNumber,
      expiryDate,
      cvv,
      cardholderName,
      email
    } = req.body;

    // Validation
    if (!registrationId || !amount || !paymentMethod || !email) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (paymentMethod === 'card' && (!cardNumber || !expiryDate || !cvv || !cardholderName)) {
      return res.status(400).json({ message: 'Card details are required for card payments' });
    }

    // Check if registration exists
    const registration = await db.getRegistrationById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Extract last 4 digits of card
    const cardLastFour = paymentMethod === 'card' ? cardNumber.slice(-4) : null;

    // Generate transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = await db.createPayment({
      registrationId,
      amount: parseFloat(amount),
      paymentMethod,
      cardLastFour,
      cardholderName,
      email,
      transactionId,
      status: 'completed'
    });

    res.status(201).json({
      message: 'Payment processed successfully',
      payment: {
        id: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all payments (Admin only)
router.get('/all', async (req, res) => {
  try {
    const payments = await db.getAllPayments();
    res.json({
      message: 'Payments retrieved successfully',
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error('Fetch payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payments by registration ID
router.get('/registration/:registrationId', async (req, res) => {
  try {
    const payments = await db.getPaymentsByRegistrationId(req.params.registrationId);
    res.json({
      message: 'Payments retrieved successfully',
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error('Fetch payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single payment
router.get('/:id', async (req, res) => {
  try {
    const payment = await db.getPaymentById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({
      message: 'Payment retrieved successfully',
      data: payment,
    });
  } catch (error) {
    console.error('Fetch payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;