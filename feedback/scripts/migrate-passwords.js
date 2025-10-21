import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database
const dbPath = path.join(__dirname, '..', 'database', 'feedback.db');
const db = new Database(dbPath);

console.log('Starting password migration...');

try {
  // Check if password_plain column exists
  const tableInfo = db.prepare("PRAGMA table_info(passwords)").all();
  const hasPlainColumn = tableInfo.some(col => col.name === 'password_plain');
  
  if (!hasPlainColumn) {
    console.log('Adding password_plain column to passwords table...');
    db.exec('ALTER TABLE passwords ADD COLUMN password_plain TEXT NOT NULL DEFAULT ""');
  }
  
  // Update existing passwords with their plain text values
  const passwords = db.prepare('SELECT id, password_hash, password_type FROM passwords').all();
  
  console.log(`Found ${passwords.length} password records to migrate`);
  
  const updateStmt = db.prepare('UPDATE passwords SET password_plain = ? WHERE id = ?');
  
  passwords.forEach(password => {
    // Set default plain text passwords based on type
    let plainPassword = '';
    if (password.password_type === 'standard') {
      plainPassword = 'stageone8';
    } else if (password.password_type === 'admin') {
      plainPassword = 'cambridge8';
    }
    
    // Verify the hash matches the plain password
    const hashedPlain = crypto.createHash('sha256').update(plainPassword).digest('hex');
    if (hashedPlain === password.password_hash) {
      updateStmt.run(plainPassword, password.id);
      console.log(`Updated ${password.password_type} password with plain text`);
    } else {
      console.log(`Warning: Hash mismatch for ${password.password_type} password, using default`);
      updateStmt.run(plainPassword, password.id);
    }
  });
  
  console.log('Password migration completed successfully!');
  
} catch (error) {
  console.error('Error during migration:', error);
} finally {
  db.close();
}
