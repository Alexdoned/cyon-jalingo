import express from 'express';
import db from '../database.js';

const router = express.Router();

// Submit registration form
router.post('/register', async (req, res) => {
  try {
    const { denary, parish, name, phone, email, address, occupation } = req.body;

    // Validation
    if (!denary || !parish || !name || !phone || !email || !address || !occupation) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    // Phone validation
    const phoneRegex = /^\+?\d{10,}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const registration = await db.createRegistration({
      denary,
      parish,
      name,
      phone,
      email,
      address,
      occupation,
    });

    res.status(201).json({
      message: 'Registration submitted successfully',
      id: registration.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get registration by ID
router.get('/register/:id', async (req, res) => {
  try {
    const registration = await db.getRegistrationById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json({
      message: 'Registration retrieved successfully',
      data: registration
    });
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
