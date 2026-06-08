import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const admin = await db.verifyAdminPassword(username, password);

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: { id: admin.id, username: admin.username, email: admin.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all registrations (Admin only)
router.get('/submissions', verifyToken, async (req, res) => {
  try {
    const registrations = await db.getAllRegistrations();
    res.json({
      message: 'Registrations retrieved successfully',
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    console.error('Fetch registrations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single registration (Admin only)
router.get('/submissions/:id', verifyToken, async (req, res) => {
  try {
    const registration = await db.getRegistrationById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json({
      message: 'Registration retrieved successfully',
      data: registration,
    });
  } catch (error) {
    console.error('Fetch registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update registration status (Admin only)
router.put('/submissions/:id', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const registration = await db.updateRegistrationStatus(req.params.id, status);

    res.json({
      message: 'Registration updated successfully',
      data: { id: req.params.id, status },
    });
  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete registration (Admin only)
router.delete('/submissions/:id', verifyToken, async (req, res) => {
  try {
    await db.deleteRegistration(req.params.id);

    res.json({
      message: 'Registration deleted successfully',
    });
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change admin password (Admin only)
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }

    const admin = await db.getAdminById(req.adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // verify current password
    const isValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isValid) return res.status(401).json({ message: 'Current password is incorrect' });

    await db.updateAdminPassword(admin.username, newPassword);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

