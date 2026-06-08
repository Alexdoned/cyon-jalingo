import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import registrationRoutes from './routes/registration.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import diocesanRoutes from './routes/diocesan.js';
import eventsRoutes from './routes/events.js';
import leadersRoutes from './routes/leaders.js';
import db from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/diocesan', diocesanRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/leaders', leadersRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ message: 'Server is running', database: 'SQLite' });
});

// Serve frontend static files if available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, '../my_App/dist');

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:5000${PORT}`);
  console.log('Database: SQLite (cyon.db)');
});
