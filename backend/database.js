import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// Connect using DATABASE_URL (set by Render automatically)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

class Database {
  constructor() {
    // Run table init after a short delay to ensure pool is ready
    this.initTables();
  }

  async query(sql, params = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(sql, params);
      return result;
    } finally {
      client.release();
    }
  }

  async initTables() {
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
        "submittedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        "registrationId" TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        "paymentMethod" TEXT NOT NULL,
        "cardLastFour" TEXT,
        "cardholderName" TEXT,
        email TEXT NOT NULL,
        status TEXT DEFAULT 'completed',
        "transactionId" TEXT,
        "paidAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("registrationId") REFERENCES registrations(id)
      )`,
      `CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS diocesan_accounts (
        id TEXT PRIMARY KEY,
        denary TEXT UNIQUE NOT NULL,
        "dioceseName" TEXT NOT NULL,
        "accountHolderName" TEXT NOT NULL,
        "accountNumber" TEXT NOT NULL,
        "bankName" TEXT NOT NULL,
        "sortCode" TEXT,
        "routingNumber" TEXT,
        currency TEXT DEFAULT 'USD',
        "isActive" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        denary TEXT NOT NULL,
        parish TEXT,
        event_date DATE NOT NULL,
        uploaded_by TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS event_media (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS leaders (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        year INTEGER NOT NULL,
        achievement TEXT NOT NULL,
        photo_url TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const sql of tables) {
      try {
        await this.query(sql);
      } catch (err) {
        console.error('Error creating table:', err.message);
      }
    }

    await this.ensureDefaultAdmin();
  }

  async ensureDefaultAdmin() {
    try {
      const result = await this.query('SELECT COUNT(*) as count FROM admins');
      const count = parseInt(result.rows[0].count, 10);

      if (count === 0) {
        console.log('No admins found. Creating default admin...');
        const hashedPassword = await bcrypt.hash('Lanwebanu@#34', 10);
        const id = uuidv4();
        await this.query(
          'INSERT INTO admins (id, username, email, password) VALUES ($1, $2, $3, $4)',
          [id, 'admin', 'admin@cyon.com', hashedPassword]
        );
        console.log('Default admin created successfully. Username: admin');
      }
    } catch (error) {
      console.error('Error ensuring default admin:', error.message);
    }
  }

  // ── Registration methods ─────────────────────────────────────────────────

  async createRegistration(registrationData) {
    const id = uuidv4();
    const { denary, parish, name, phone, email, address, occupation } = registrationData;

    await this.query(
      `INSERT INTO registrations (id, denary, parish, name, phone, email, address, occupation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, denary, parish, name, phone, email, address, occupation]
    );
    return { id, ...registrationData };
  }

  async getAllRegistrations() {
    const result = await this.query('SELECT * FROM registrations ORDER BY "submittedAt" DESC');
    return result.rows;
  }

  async getRegistrationById(id) {
    const result = await this.query('SELECT * FROM registrations WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async updateRegistrationStatus(id, status) {
    const result = await this.query(
      'UPDATE registrations SET status = $1 WHERE id = $2',
      [status, id]
    );
    if (result.rowCount === 0) throw new Error('Registration not found');
    return { id, status };
  }

  async deleteRegistration(id) {
    const result = await this.query('DELETE FROM registrations WHERE id = $1', [id]);
    if (result.rowCount === 0) throw new Error('Registration not found');
    return { id };
  }

  // ── Payment methods ──────────────────────────────────────────────────────

  async createPayment(paymentData) {
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
      transactionId,
    } = paymentData;

    await this.query(
      `INSERT INTO payments (id, "registrationId", amount, currency, "paymentMethod", "cardLastFour", "cardholderName", email, status, "transactionId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, registrationId, amount, currency, paymentMethod, cardLastFour, cardholderName, email, status, transactionId]
    );
    return { id, registrationId, amount, currency, paymentMethod, cardLastFour, cardholderName, email, status, transactionId };
  }

  async getAllPayments() {
    const result = await this.query(`
      SELECT p.*, r.name, r.email as "registrationEmail", r.phone, r.denary
      FROM payments p
      LEFT JOIN registrations r ON p."registrationId" = r.id
      ORDER BY p."paidAt" DESC
    `);
    return result.rows;
  }

  async getPaymentById(id) {
    const result = await this.query(`
      SELECT p.*, r.name, r.email as "registrationEmail", r.phone, r.denary
      FROM payments p
      LEFT JOIN registrations r ON p."registrationId" = r.id
      WHERE p.id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  async getPaymentsByRegistrationId(registrationId) {
    const result = await this.query(
      'SELECT * FROM payments WHERE "registrationId" = $1 ORDER BY "paidAt" DESC',
      [registrationId]
    );
    return result.rows;
  }

  // ── Admin methods ────────────────────────────────────────────────────────

  async createAdmin(adminData) {
    const id = uuidv4();
    const { username, email, password } = adminData;
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.query(
      'INSERT INTO admins (id, username, email, password) VALUES ($1, $2, $3, $4)',
      [id, username, email, hashedPassword]
    );
    return { id, username, email };
  }

  async findAdminByUsername(username) {
    const result = await this.query('SELECT * FROM admins WHERE username = $1', [username]);
    return result.rows[0] || null;
  }

  async verifyAdminPassword(username, password) {
    const admin = await this.findAdminByUsername(username);
    if (!admin) return false;
    const isValid = await bcrypt.compare(password, admin.password);
    return isValid ? admin : false;
  }

  async getAdminById(id) {
    const result = await this.query('SELECT * FROM admins WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async updateAdminPassword(username, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await this.query(
      'UPDATE admins SET password = $1 WHERE username = $2',
      [hashedPassword, username]
    );
    if (result.rowCount === 0) throw new Error('Admin not found');
    return { username, message: 'Password updated successfully' };
  }

  // ── Diocesan Account methods ─────────────────────────────────────────────

  async createDiocesan(diocesanData) {
    const id = uuidv4();
    const { denary, dioceseName, accountHolderName, accountNumber, bankName, sortCode, routingNumber, currency } = diocesanData;

    await this.query(
      `INSERT INTO diocesan_accounts (id, denary, "dioceseName", "accountHolderName", "accountNumber", "bankName", "sortCode", "routingNumber", currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, denary, dioceseName, accountHolderName, accountNumber, bankName, sortCode || null, routingNumber || null, currency || 'USD']
    );
    return { id, denary, dioceseName, accountHolderName, accountNumber, bankName, sortCode, routingNumber, currency };
  }

  async getDiocesan(denary) {
    const result = await this.query('SELECT * FROM diocesan_accounts WHERE denary = $1', [denary]);
    return result.rows[0] || null;
  }

  async getAllDiocesan() {
    const result = await this.query('SELECT * FROM diocesan_accounts ORDER BY "dioceseName" ASC');
    return result.rows;
  }

  async updateDiocesan(denary, diocesanData) {
    const { dioceseName, accountHolderName, accountNumber, bankName, sortCode, routingNumber, currency, isActive } = diocesanData;

    await this.query(
      `UPDATE diocesan_accounts
       SET "dioceseName" = $1, "accountHolderName" = $2, "accountNumber" = $3, "bankName" = $4,
           "sortCode" = $5, "routingNumber" = $6, currency = $7, "isActive" = $8, "updatedAt" = CURRENT_TIMESTAMP
       WHERE denary = $9`,
      [dioceseName, accountHolderName, accountNumber, bankName, sortCode || null, routingNumber || null, currency || 'USD', isActive !== undefined ? isActive : true, denary]
    );
    return { denary, dioceseName, accountHolderName, accountNumber, bankName, sortCode, routingNumber, currency, isActive };
  }

  async deleteDiocesan(denary) {
    await this.query('DELETE FROM diocesan_accounts WHERE denary = $1', [denary]);
    return { denary };
  }

  // ── Event methods ────────────────────────────────────────────────────────

  async getAllEvents() {
    const result = await this.query(`
      SELECT e.*, a.username as uploader_name
      FROM events e
      LEFT JOIN admins a ON e.uploaded_by = a.id
      ORDER BY e.created_at DESC
    `);
    return result.rows;
  }

  async getEventById(id) {
    const result = await this.query(`
      SELECT e.*, a.username as uploader_name
      FROM events e
      LEFT JOIN admins a ON e.uploaded_by = a.id
      WHERE e.id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  async getEventMedia(eventId) {
    const result = await this.query(
      'SELECT * FROM event_media WHERE event_id = $1 ORDER BY created_at ASC',
      [eventId]
    );
    return result.rows;
  }

  async createEvent(eventData) {
    const { title, description, denary, parish, event_date, uploaded_by } = eventData;

    const result = await this.query(
      `INSERT INTO events (title, description, denary, parish, event_date, uploaded_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
      [title, description || '', denary, parish || '', event_date, uploaded_by || null]
    );
    return { id: result.rows[0].id };
  }

  async createEventMedia(eventId, file) {
    const result = await this.query(
      `INSERT INTO event_media (event_id, filename, original_name, mime_type, file_path, file_size, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
      [eventId, file.filename, file.originalname, file.mimetype, file.path, file.size]
    );
    return { id: result.rows[0].id };
  }

  async updateEvent(eventId, eventData) {
    const { title, description, denary, parish, event_date } = eventData;

    const result = await this.query(
      `UPDATE events
       SET title = $1, description = $2, denary = $3, parish = $4, event_date = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [title, description, denary, parish, event_date, eventId]
    );
    if (result.rowCount === 0) throw new Error('Event not found');
    return { id: eventId, title, description, denary, parish, event_date };
  }

  async deleteEvent(eventId) {
    await this.query('DELETE FROM events WHERE id = $1', [eventId]);
    return { id: eventId };
  }

  async deleteEventMedia(eventId) {
    await this.query('DELETE FROM event_media WHERE event_id = $1', [eventId]);
  }

  // ── Leader methods ───────────────────────────────────────────────────────

  async getAllLeaders() {
    const result = await this.query('SELECT * FROM leaders ORDER BY year DESC, created_at DESC');
    return result.rows || [];
  }

  async getLeaderById(id) {
    const result = await this.query('SELECT * FROM leaders WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async createLeader(leaderData) {
    const { name, year, achievement, photo_url } = leaderData;

    const result = await this.query(
      `INSERT INTO leaders (name, year, achievement, photo_url, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
      [name, year, achievement, photo_url]
    );
    return { id: result.rows[0].id };
  }

  async updateLeader(id, leaderData) {
    const { name, year, achievement, photo_url } = leaderData;

    const result = await this.query(
      `UPDATE leaders
       SET name = $1, year = $2, achievement = $3, photo_url = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [name, year, achievement, photo_url, id]
    );
    if (result.rowCount === 0) throw new Error('Leader not found');
    return { id, name, year, achievement, photo_url };
  }

  async deleteLeader(id) {
    await this.query('DELETE FROM leaders WHERE id = $1', [id]);
  }

  // ── Graceful shutdown ────────────────────────────────────────────────────

  close() {
    pool.end(() => {
      console.log('Database pool closed');
    });
  }
}

export default new Database();