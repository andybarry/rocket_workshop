import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FeedbackDB {
  constructor() {
    this.dbPath = path.join(__dirname, 'feedback.db');
    this.db = new Database(this.dbPath);
    this.initializeDatabase();
  }

  initializeDatabase() {
    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    
    // Create tables
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    this.db.exec(schema);
    
    // Prepare statements for better performance
    this.prepareStatements();
    
    // Initialize passwords
    this.initializePasswords();
  }

  prepareStatements() {
    this.insertStmt = this.db.prepare(`
      INSERT INTO feedback (workshop_type, form_data, timestamp)
      VALUES (?, ?, ?)
    `);
    
    this.selectByWorkshopStmt = this.db.prepare(`
      SELECT * FROM feedback 
      WHERE workshop_type = ? 
      ORDER BY timestamp DESC
    `);
    
    this.selectAllStmt = this.db.prepare(`
      SELECT * FROM feedback 
      ORDER BY workshop_type, timestamp DESC
    `);
    
    this.deleteStmt = this.db.prepare(`
      DELETE FROM feedback 
      WHERE id = ? AND workshop_type = ?
    `);
    
    this.countByWorkshopStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM feedback WHERE workshop_type = ?
    `);
    
    // Password-related statements
    this.getPasswordStmt = this.db.prepare(`
      SELECT password_hash, password_plain FROM passwords WHERE password_type = ? ORDER BY created_at DESC LIMIT 1
    `);
    
    this.insertPasswordStmt = this.db.prepare(`
      INSERT INTO passwords (password_hash, password_plain, password_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    this.updatePasswordStmt = this.db.prepare(`
      UPDATE passwords SET password_hash = ?, password_plain = ?, updated_at = ? WHERE password_type = ? AND id = (
        SELECT id FROM passwords WHERE password_type = ? ORDER BY created_at DESC LIMIT 1
      )
    `);
    
    this.hasPasswordStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM passwords WHERE password_type = ?
    `);
  }

  // Convert any device/locale date string into the standard MM/DD/YYYY format.
  // Users submit on devices with different regional settings, so the stored date
  // arrives as '5/14/2026', '2026.5.14', '2026-06-10', '14/05/2026', etc. These
  // all encode the same day, just reordered, so we detect the year position and
  // re-order to MM/DD/YYYY. The ISO timestamp is used to disambiguate ambiguous
  // slash dates and as a fallback when the string can't be parsed.
  normalizeDate(dateStr, timestamp) {
    const pad = (n) => String(n).padStart(2, '0');

    // Format the server timestamp (UTC ISO) as MM/DD/YYYY in US Eastern time.
    const fromTimestamp = () => {
      if (!timestamp) return dateStr || '';
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return dateStr || '';
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(d);
      const get = (type) => parts.find((p) => p.type === type)?.value;
      return `${get('month')}/${get('day')}/${get('year')}`;
    };

    const build = (month, day, year) => {
      if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null;
      return `${pad(month)}/${pad(day)}/${year}`;
    };

    if (!dateStr || typeof dateStr !== 'string') return fromTimestamp();

    const nums = dateStr.trim().split(/[\/.\-\s]+/).map((p) => parseInt(p, 10));
    if (nums.length !== 3 || nums.some((n) => isNaN(n))) return fromTimestamp();

    const [a, b, c] = nums;
    let result = null;

    if (a >= 1000) {
      // Year first: YYYY M D
      result = build(b, c, a);
    } else if (c >= 1000) {
      // Year last: a/b/YYYY -> month/day or day/month
      if (a > 12 && b <= 12) {
        result = build(b, a, c); // a is day (D/M)
      } else if (b > 12 && a <= 12) {
        result = build(a, b, c); // a is month (M/D)
      } else {
        // Ambiguous (both <= 12): disambiguate using the timestamp's ET day.
        const tsDate = fromTimestamp();
        const tsParts = tsDate.split('/').map((p) => parseInt(p, 10));
        if (tsParts.length === 3 && tsParts[0] === b && tsParts[1] === a) {
          result = build(b, a, c); // timestamp matches day/month reading
        } else {
          result = build(a, b, c); // default to US month/day
        }
      }
    }

    return result || fromTimestamp();
  }

  // Normalize legacy field names so older submissions display consistently.
  // The Mechanical survey previously stored some answers under non-standard keys
  // ('recommend-next-year', 'something-to-design'); every table/graph reads the
  // standard keys ('recommend-workshop', 'next-design'), so map the old keys forward.
  // Also standardizes the date field to MM/DD/YYYY regardless of device locale.
  normalizeFormData(formData, timestamp) {
    const legacyKeyMap = {
      'recommend-next-year': 'recommend-workshop',
      'something-to-design': 'next-design',
    };

    for (const [legacyKey, standardKey] of Object.entries(legacyKeyMap)) {
      if (
        formData[legacyKey] !== undefined &&
        (formData[standardKey] === undefined || formData[standardKey] === '')
      ) {
        formData[standardKey] = formData[legacyKey];
      }
    }

    if (formData.date) {
      formData.date = this.normalizeDate(formData.date, timestamp);
    }

    return formData;
  }

  // Methods for CRUD operations
  insertFeedback(workshopType, formData) {
    const timestamp = new Date().toISOString();
    const result = this.insertStmt.run(workshopType, JSON.stringify(formData), timestamp);
    return { id: result.lastInsertRowid, timestamp };
  }

  getFeedbackByWorkshop(workshopType) {
    const rows = this.selectByWorkshopStmt.all(workshopType);
    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      ...this.normalizeFormData(JSON.parse(row.form_data), row.timestamp)
    }));
  }

  getAllFeedback() {
    const rows = this.selectAllStmt.all();
    const grouped = {};
    
    rows.forEach(row => {
      if (!grouped[row.workshop_type]) {
        grouped[row.workshop_type] = [];
      }
      grouped[row.workshop_type].push({
        id: row.id,
        timestamp: row.timestamp,
        ...this.normalizeFormData(JSON.parse(row.form_data), row.timestamp)
      });
    });
    
    return grouped;
  }

  deleteFeedback(id, workshopType) {
    const result = this.deleteStmt.run(id, workshopType);
    return result.changes > 0;
  }

  getStats() {
    const stats = {};
    ['AI', 'Robotics', 'Mechanical', 'Instructor'].forEach(type => {
      const result = this.countByWorkshopStmt.get(type);
      stats[type] = result.count;
    });
    return stats;
  }

  // Password-related methods
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  verifyPassword(password, passwordType = 'standard') {
    const result = this.getPasswordStmt.get(passwordType);
    if (!result) {
      return false; // No password set
    }
    const hashedInput = this.hashPassword(password);
    return hashedInput === result.password_hash;
  }

  setPassword(password, passwordType = 'standard') {
    const hashedPassword = this.hashPassword(password);
    const timestamp = new Date().toISOString();
    
    // Check if a password already exists for this type
    const existingPassword = this.getPasswordStmt.get(passwordType);
    
    if (existingPassword) {
      // Update existing password
      this.updatePasswordStmt.run(hashedPassword, password, timestamp, passwordType, passwordType);
    } else {
      // Insert new password
      this.insertPasswordStmt.run(hashedPassword, password, passwordType, timestamp, timestamp);
    }
    
    return true;
  }

  hasPassword(passwordType = 'standard') {
    const result = this.hasPasswordStmt.get(passwordType);
    return result.count > 0;
  }

  getPassword(passwordType = 'standard') {
    const result = this.getPasswordStmt.get(passwordType);
    return result ? result.password_plain : null;
  }

  initializePasswords() {
    // Initialize with hardcoded passwords if they don't exist
    if (!this.hasPassword('standard')) {
      this.setPassword('stageone8', 'standard');
    }
    if (!this.hasPassword('admin')) {
      this.setPassword('cambridge8', 'admin');
    }
  }

  close() {
    this.db.close();
  }
}

export default FeedbackDB;
