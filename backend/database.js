import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

class Database {
  constructor() {
    this.db = new sqlite3.Database('./cyon.db', (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.initTables();
      }
    });
  }

  initTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        denary TEXT NOT NULL,
        parish TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT NOT NULL,
        occupation TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        registrationId TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        paymentMethod TEXT NOT NULL,
        cardLastFour TEXT,
        cardholderName TEXT,
        email TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        transactionId TEXT,
        paidAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (registrationId) REFERENCES registrations(id)
      )`,
      `CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS diocesan_accounts (
        id TEXT PRIMARY KEY,
        denary TEXT UNIQUE NOT NULL,
        dioceseName TEXT NOT NULL,
        accountHolderName TEXT NOT NULL,
        accountNumber TEXT NOT NULL,
        bankName TEXT NOT NULL,
        sortCode TEXT,
        routingNumber TEXT,
        currency TEXT DEFAULT 'USD',
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        denary TEXT NOT NULL,
        parish TEXT,
        event_date DATE NOT NULL,
        uploaded_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS event_media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS leaders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        year INTEGER NOT NULL,
        achievement TEXT NOT NULL,
        photo_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    tables.forEach(sql => {
      this.db.run(sql, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
        }
      });
    });

    // Ensure legacy and new bank code columns remain compatible
    this.db.all('PRAGMA table_info(diocesan_accounts)', (err, rows) => {
      if (err) {
        console.error('Error checking diocesan_accounts columns:', err.message);
        return;
      }

      const hasSortCode = rows.some(col => col.name === 'sortCode');
      const hasSwiftCode = rows.some(col => col.name === 'swiftCode');

      if (!hasSortCode) {
        this.db.run('ALTER TABLE diocesan_accounts ADD COLUMN sortCode TEXT', (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column name')) {
            console.error('Error adding sortCode column:', alterErr.message);
          } else if (hasSwiftCode) {
            this.db.run('UPDATE diocesan_accounts SET sortCode = swiftCode WHERE sortCode IS NULL', (updateErr) => {
              if (updateErr) {
                console.error('Error migrating swiftCode to sortCode:', updateErr.message);
              }
            });
          }
        });
      } else if (hasSwiftCode) {
        this.db.run('UPDATE diocesan_accounts SET sortCode = swiftCode WHERE sortCode IS NULL', (updateErr) => {
          if (updateErr) {
            console.error('Error migrating swiftCode to sortCode:', updateErr.message);
          }
        });
      }
    });
  }

  // Wait for tables to be initialized
  async waitForInit() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

  // Registration methods
  async createRegistration(registrationData) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const { denary, parish, name, phone, email, address, occupation } = registrationData;

      const sql = `
        INSERT INTO registrations (id, denary, parish, name, phone, email, address, occupation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [id, denary, parish, name, phone, email, address, occupation], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...registrationData });
        }
      });
    });
  }

  async getAllRegistrations() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM registrations ORDER BY submittedAt DESC';

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getRegistrationById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM registrations WHERE id = ?';

      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateRegistrationStatus(id, status) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE registrations SET status = ? WHERE id = ?';

      this.db.run(sql, [status, id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Registration not found'));
        } else {
          resolve({ id, status });
        }
      });
    });
  }

  async deleteRegistration(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM registrations WHERE id = ?';

      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Registration not found'));
        } else {
          resolve({ id, message: 'Registration deleted successfully' });
        }
      });
    });
  }

  async deleteRegistration(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM registrations WHERE id = ?';

      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Registration not found'));
        } else {
          resolve({ id });
        }
      });
    });
  }

  // Payment methods
  async createPayment(paymentData) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const {
        registrationId,
        amount,
        currency = 'USD',
        paymentMethod,
        cardLastFour,
        cardholderName,
        email,
        status = 'completed',
        transactionId
      } = paymentData;

      const sql = `
        INSERT INTO payments (id, registrationId, amount, currency, paymentMethod, cardLastFour, cardholderName, email, status, transactionId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [id, registrationId, amount, currency, paymentMethod, cardLastFour, cardholderName, email, status, transactionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            registrationId,
            amount,
            currency,
            paymentMethod,
            cardLastFour,
            cardholderName,
            email,
            status,
            transactionId
          });
        }
      });
    });
  }

  async getAllPayments() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, r.name, r.email as registrationEmail, r.phone, r.denary
        FROM payments p
        LEFT JOIN registrations r ON p.registrationId = r.id
        ORDER BY p.paidAt DESC
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getPaymentById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, r.name, r.email as registrationEmail, r.phone, r.denary
        FROM payments p
        LEFT JOIN registrations r ON p.registrationId = r.id
        WHERE p.id = ?
      `;

      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getPaymentsByRegistrationId(registrationId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM payments WHERE registrationId = ? ORDER BY paidAt DESC';

      this.db.all(sql, [registrationId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Admin methods
  async createAdmin(adminData) {
    return new Promise(async (resolve, reject) => {
      try {
        const id = uuidv4();
        const { username, email, password } = adminData;
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
          INSERT INTO admins (id, username, email, password)
          VALUES (?, ?, ?, ?)
        `;

        this.db.run(sql, [id, username, email, hashedPassword], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, username, email });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async findAdminByUsername(username) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM admins WHERE username = ?';

      this.db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async verifyAdminPassword(username, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const admin = await this.findAdminByUsername(username);
        if (!admin) {
          resolve(false);
          return;
        }

        const isValid = await bcrypt.compare(password, admin.password);
        resolve(isValid ? admin : false);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getAdminById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM admins WHERE id = ?';
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateAdminPassword(username, newPassword) {
    return new Promise(async (resolve, reject) => {
      try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const sql = 'UPDATE admins SET password = ? WHERE username = ?';

        this.db.run(sql, [hashedPassword, username], function(err) {
          if (err) {
            reject(err);
          } else if (this.changes === 0) {
            reject(new Error('Admin not found'));
          } else {
            resolve({ username, message: 'Password updated successfully' });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Diocesan Account methods
  async createDiocesan(diocesanData) {
    return new Promise((resolve, reject) => {
      try {
        const id = uuidv4();
        const { denary, dioceseName, accountHolderName, accountNumber, bankName, sortCode, routingNumber, currency } = diocesanData;

        const sql = `
          INSERT INTO diocesan_accounts (id, denary, dioceseName, accountHolderName, accountNumber, bankName, sortCode, routingNumber, currency)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        this.db.run(sql, [id, denary, dioceseName, accountHolderName, accountNumber, bankName, sortCode || null, routingNumber || null, currency || 'USD'], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, denary, dioceseName, accountHolderName, accountNumber, bankName, sortCode, routingNumber, currency });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async getDiocesan(denary) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM diocesan_accounts WHERE denary = ?';

      this.db.get(sql, [denary], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getAllDiocesan() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM diocesan_accounts ORDER BY dioceseName ASC';

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getAllEvents() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT e.*, a.username as uploader_name
        FROM events e
        LEFT JOIN admins a ON e.uploaded_by = a.id
        ORDER BY e.created_at DESC
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getEventById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT e.*, a.username as uploader_name
        FROM events e
        LEFT JOIN admins a ON e.uploaded_by = a.id
        WHERE e.id = ?
      `;

      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async getEventMedia(eventId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM event_media WHERE event_id = ? ORDER BY created_at ASC';

      this.db.all(sql, [eventId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async createEvent(eventData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO events (title, description, denary, parish, event_date, uploaded_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `;

      const { title, description, denary, parish, event_date, uploaded_by } = eventData;

      this.db.run(sql, [title, description || '', denary, parish || '', event_date, uploaded_by || null], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  async createEventMedia(eventId, file) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO event_media (event_id, filename, original_name, mime_type, file_path, file_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `;

      this.db.run(sql, [eventId, file.filename, file.originalname, file.mimetype, file.path, file.size], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  async deleteEvent(eventId) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM events WHERE id = ?', [eventId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: eventId });
        }
      });
    });
  }

  async deleteEventMedia(eventId) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM event_media WHERE event_id = ?', [eventId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async updateEvent(eventId, eventData) {
    return new Promise((resolve, reject) => {
      const { title, description, denary, parish, event_date } = eventData;

      const sql = `
        UPDATE events 
        SET title = ?, description = ?, denary = ?, parish = ?, event_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(sql, [title, description, denary, parish, event_date, eventId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Event not found'));
        } else {
          resolve({ id: eventId, title, description, denary, parish, event_date });
        }
      });
    });
  }

  async getAllLeaders() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM leaders ORDER BY year DESC, created_at DESC';
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async getLeaderById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM leaders WHERE id = ?';
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async createLeader(leaderData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO leaders (name, year, achievement, photo_url, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `;
      const { name, year, achievement, photo_url } = leaderData;

      this.db.run(sql, [name, year, achievement, photo_url], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  async deleteLeader(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM leaders WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async updateLeader(id, leaderData) {
    return new Promise((resolve, reject) => {
      const { name, year, achievement, photo_url } = leaderData;

      const sql = `
        UPDATE leaders 
        SET name = ?, year = ?, achievement = ?, photo_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      this.db.run(sql, [name, year, achievement, photo_url, id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Leader not found'));
        } else {
          resolve({ id, name, year, achievement, photo_url });
        }
      });
    });
  }

  async updateDiocesan(denary, diocesanData) {
    return new Promise((resolve, reject) => {
      try {
        const { dioceseName, accountHolderName, accountNumber, bankName, sortCode, routingNumber, currency, isActive } = diocesanData;

        const sql = `
          UPDATE diocesan_accounts 
          SET dioceseName = ?, accountHolderName = ?, accountNumber = ?, bankName = ?, sortCode = ?, routingNumber = ?, currency = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE denary = ?
        `;

        this.db.run(sql, [dioceseName, accountHolderName, accountNumber, bankName, sortCode || null, routingNumber || null, currency || 'USD', isActive !== undefined ? isActive : 1, denary], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ denary, dioceseName, accountHolderName, accountNumber, bankName, sortCode, routingNumber, currency, isActive });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async deleteDiocesan(denary) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM diocesan_accounts WHERE denary = ?';

      this.db.run(sql, [denary], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ denary });
        }
      });
    });
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

export default new Database();