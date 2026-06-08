import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { verifyToken } from '../middleware/auth.js';
import db from '../database.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/events');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await db.getAllEvents();

    for (let event of events) {
      event.media = await db.getEventMedia(event.id);
    }

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

// Serve uploaded media files
router.get('/media/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../uploads/events', filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'File not found' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await db.getEventById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    event.media = await db.getEventMedia(id);

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
});

// Create new event with media upload (admin only)
router.post('/', verifyToken, upload.array('media', 20), async (req, res) => {
  try {
    const { title, description, parish, eventDate, date } = req.body;
    const denary = req.body.denary || req.body.deanery;
    const files = req.files || [];
    const event_date = eventDate || date;

    if (!req.adminId) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    if (!title || !denary || !event_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, denary, and event date are required'
      });
    }

    const eventResult = await db.createEvent({
      title,
      description,
      denary,
      parish,
      event_date,
      uploaded_by: req.adminId
    });

    for (let file of files) {
      await db.createEventMedia(eventResult.id, file);
    }

    res.json({
      success: true,
      message: 'Event created successfully',
      data: { id: eventResult.id }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
});

// Update event (admin only)
router.put('/:id', verifyToken, upload.array('media', 20), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, parish, eventDate, date } = req.body;
    const denary = req.body.denary || req.body.deanery;
    const files = req.files || [];
    const event_date = eventDate || date;

    if (!req.adminId) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    if (!title || !denary || !event_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, denary, and event date are required'
      });
    }

    // Update event
    const updatedEvent = await db.updateEvent(id, {
      title,
      description,
      denary,
      parish,
      event_date
    });

    // If new media files are uploaded, add them
    if (files.length > 0) {
      for (let file of files) {
        await db.createEventMedia(id, file);
      }
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
});

// Delete event (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.adminId) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    // Get media files to delete from filesystem
    const mediaFiles = await db.getEventMedia(id);

    for (let media of mediaFiles) {
      try {
        if (fs.existsSync(media.file_path)) {
          fs.unlinkSync(media.file_path);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
      }
    }

    await db.deleteEventMedia(id);
    await db.deleteEvent(id);


    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
});

export default router;