import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../database.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/leaders');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for photos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all leaders
router.get('/', async (req, res) => {
  try {
    const leaders = await db.getAllLeaders();
    res.json({ success: true, data: leaders });
  } catch (error) {
    console.error('Error fetching leaders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaders' });
  }
});

// Get single leader
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const leader = await db.getLeaderById(id);

    if (!leader) {
      return res.status(404).json({ success: false, message: 'Leader not found' });
    }

    res.json({ success: true, data: leader });
  } catch (error) {
    console.error('Error fetching leader:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leader' });
  }
});

// Serve leader photos
router.get('/photo/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../uploads/leaders', filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'Photo not found' });
  }
});

// Create new leader with photo
router.post('/', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const { name, year, achievement, photo_url, imageUrl } = req.body;
    const file = req.file;
    const photoUrl = file ? file.filename : photo_url || imageUrl;

    // Ensure requester is an authenticated admin
    if (!req.adminId) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    if (!name || !year || !achievement) {
      return res.status(400).json({
        success: false,
        message: 'Name, year, and achievement are required'
      });
    }

    const leaderResult = await db.createLeader({
      name,
      year: parseInt(year),
      achievement,
      photo_url: photoUrl || ''
    });

    res.json({
      success: true,
      message: 'Leader profile added successfully',
      data: { id: leaderResult.id }
    });
  } catch (error) {
    console.error('Error creating leader:', error);
    res.status(500).json({ success: false, message: 'Failed to create leader profile' });
  }
});

// Update leader (with optional photo update)
router.put('/:id', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, year, achievement, photo_url: bodyPhotoUrl, imageUrl } = req.body;
    const file = req.file;
    const photoUrl = file ? file.filename : bodyPhotoUrl || imageUrl;

    // Ensure requester is an authenticated admin
    if (!req.adminId) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    if (!name || !year || !achievement) {
      return res.status(400).json({
        success: false,
        message: 'Name, year, and achievement are required'
      });
    }

    // Get existing leader
    const existingLeader = await db.getLeaderById(id);
    if (!existingLeader) {
      return res.status(404).json({ success: false, message: 'Leader not found' });
    }

    let photo_url = existingLeader.photo_url;

    // If new photo uploaded or URL provided, use it
    if (file) {
      // Delete old photo file
      if (existingLeader.photo_url) {
        const oldFilePath = path.join(__dirname, '../uploads/leaders', existingLeader.photo_url);
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        } catch (fileError) {
          console.error('Error deleting old photo file:', fileError);
        }
      }
      photo_url = file.filename;
    }

    const updatedLeader = await db.updateLeader(id, {
      name,
      year: parseInt(year),
      achievement,
      photo_url
    });

    res.json({
      success: true,
      message: 'Leader profile updated successfully',
      data: updatedLeader
    });
  } catch (error) {
    console.error('Error updating leader:', error);
    res.status(500).json({ success: false, message: 'Failed to update leader profile' });
  }
});

// Delete leader
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure requester is an authenticated admin
    if (!req.adminId) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // Get leader to find photo file
    const leader = await db.getLeaderById(id);
    if (!leader) {
      return res.status(404).json({ success: false, message: 'Leader not found' });
    }

    // Delete photo file from filesystem
    if (leader.photo_url) {
      const filePath = path.join(__dirname, '../uploads/leaders', leader.photo_url);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.error('Error deleting photo file:', fileError);
      }
    }

    // Delete from database
    await db.deleteLeader(id);

    res.json({ success: true, message: 'Leader profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting leader:', error);
    res.status(500).json({ success: false, message: 'Failed to delete leader profile' });
  }
});

export default router;
