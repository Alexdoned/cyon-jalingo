import express from 'express';
import db from '../database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Create diocesan account (Admin only)
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { denary, dioceseName, accountHolderName, accountNumber, bankName, sortCode, routingNumber, currency } = req.body;

    if (!denary || !dioceseName || !accountHolderName || !accountNumber || !bankName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const diocesan = await db.createDiocesan({
      denary,
      dioceseName,
      accountHolderName,
      accountNumber,
      bankName,
      sortCode,
      routingNumber,
      currency
    });

    res.status(201).json({
      message: 'Diocesan account created successfully',
      data: diocesan
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: 'Diocesan account already exists for this denary' });
    }
    console.error('Create diocesan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get diocesan account by denary
router.get('/:denary', async (req, res) => {
  try {
    const diocesan = await db.getDiocesan(req.params.denary);

    if (!diocesan) {
      return res.status(404).json({ message: 'Diocesan account not found' });
    }

    res.json({
      message: 'Diocesan account retrieved successfully',
      data: diocesan
    });
  } catch (error) {
    console.error('Get diocesan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all diocesan accounts
router.get('/', async (req, res) => {
  try {
    const diocesans = await db.getAllDiocesan();

    res.json({
      message: 'Diocesan accounts retrieved successfully',
      count: diocesans.length,
      data: diocesans
    });
  } catch (error) {
    console.error('Get all diocesan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update diocesan account (Admin only)
router.put('/:denary', verifyToken, async (req, res) => {
  try {
    const { dioceseName, accountHolderName, accountNumber, bankName, sortCode, routingNumber, currency, isActive } = req.body;

    if (!dioceseName || !accountHolderName || !accountNumber || !bankName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const diocesan = await db.updateDiocesan(req.params.denary, {
      dioceseName,
      accountHolderName,
      accountNumber,
      bankName,
      sortCode,
      routingNumber,
      currency,
      isActive
    });

    res.json({
      message: 'Diocesan account updated successfully',
      data: diocesan
    });
  } catch (error) {
    console.error('Update diocesan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete diocesan account (Admin only)
router.delete('/:denary', verifyToken, async (req, res) => {
  try {
    await db.deleteDiocesan(req.params.denary);

    res.json({
      message: 'Diocesan account deleted successfully'
    });
  } catch (error) {
    console.error('Delete diocesan error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
