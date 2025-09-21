import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

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
      ...JSON.parse(row.form_data)
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
        ...JSON.parse(row.form_data)
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

  close() {
    this.db.close();
  }
}

export default FeedbackDB;
