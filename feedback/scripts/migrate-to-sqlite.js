import FeedbackDB from '../database/db.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateData() {
  const db = new FeedbackDB();
  const jsonFile = path.join(__dirname, '..', 'feedback-data.json');
  
  try {
    // Check if JSON file exists
    try {
      await fs.access(jsonFile);
    } catch (error) {
      console.log('❌ No feedback-data.json file found. Nothing to migrate.');
      db.close();
      return;
    }

    // Read existing JSON data
    const jsonData = JSON.parse(await fs.readFile(jsonFile, 'utf8'));
    
    let totalMigrated = 0;
    
    // Migrate each workshop type
    for (const [workshopType, feedbacks] of Object.entries(jsonData)) {
      if (!Array.isArray(feedbacks)) continue;
      
      console.log(`📦 Migrating ${feedbacks.length} entries for ${workshopType}...`);
      
      for (const feedback of feedbacks) {
        // Extract the form data (everything except id and timestamp)
        const { id, timestamp, ...formData } = feedback;
        
        // Insert into SQLite
        db.insertFeedback(workshopType, formData);
        totalMigrated++;
      }
    }
    
    console.log(`✅ Migration complete! Migrated ${totalMigrated} feedback entries.`);
    
    // Backup original JSON file
    const backupFile = path.join(__dirname, '..', 'feedback-data.json.backup');
    await fs.copyFile(jsonFile, backupFile);
    console.log(`📁 Original data backed up to: ${backupFile}`);
    
    // Show stats
    const stats = db.getStats();
    console.log('\n📊 Database Statistics:');
    Object.entries(stats).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} entries`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    db.close();
  }
}

migrateData();
