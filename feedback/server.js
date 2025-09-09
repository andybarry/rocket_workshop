import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(express.json());

// Data file path
const DATA_FILE = path.join(__dirname, 'feedback-data.json');

// Initialize data file if it doesn't exist
async function initializeDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // File doesn't exist, create it with empty structure
    const initialData = {
      AI: [],
      Robotics: [],
      Mechanical: []
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Read feedback data
async function readFeedbackData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading feedback data:', error);
    return { AI: [], Robotics: [], Mechanical: [] };
  }
}

// Write feedback data
async function writeFeedbackData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing feedback data:', error);
    return false;
  }
}

// Routes

// Get all feedback data
app.get('/api/feedback', async (req, res) => {
  try {
    const data = await readFeedbackData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read feedback data' });
  }
});

// Submit new feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { workshopType, feedbackData } = req.body;
    
    if (!workshopType || !feedbackData) {
      return res.status(400).json({ error: 'Workshop type and feedback data are required' });
    }

    // Add timestamp
    const submission = {
      ...feedbackData,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random().toString(36).substr(2, 9)
    };

    // Read current data
    const data = await readFeedbackData();
    
    // Add new submission
    if (!data[workshopType]) {
      data[workshopType] = [];
    }
    data[workshopType].push(submission);

    // Write back to file
    const success = await writeFeedbackData(data);
    
    if (success) {
      res.json({ success: true, message: 'Feedback submitted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save feedback data' });
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get feedback for specific workshop type
app.get('/api/feedback/:workshopType', async (req, res) => {
  try {
    const { workshopType } = req.params;
    console.log(`GET /api/feedback/${workshopType} - Request received`);
    const data = await readFeedbackData();
    
    if (!data[workshopType]) {
      console.log(`No data found for workshop type: ${workshopType}`);
      return res.json([]);
    }
    
    console.log(`Returning ${data[workshopType].length} records for ${workshopType}`);
    res.json(data[workshopType]);
  } catch (error) {
    console.error('Error in GET /api/feedback/:workshopType:', error);
    res.status(500).json({ error: 'Failed to read feedback data' });
  }
});

// Delete specific feedback entry
app.delete('/api/feedback/:workshopType/:id', async (req, res) => {
  try {
    const { workshopType, id } = req.params;
    console.log(`DELETE /api/feedback/${workshopType}/${id} - Request received`);
    
    const data = await readFeedbackData();
    
    if (!data[workshopType]) {
      return res.status(404).json({ error: 'Workshop type not found' });
    }
    
    // Find and remove the feedback entry
    const initialLength = data[workshopType].length;
    data[workshopType] = data[workshopType].filter(entry => entry.id !== id);
    
    if (data[workshopType].length === initialLength) {
      return res.status(404).json({ error: 'Feedback entry not found' });
    }
    
    // Write back to file
    const success = await writeFeedbackData(data);
    
    if (success) {
      console.log(`Successfully deleted feedback entry ${id} from ${workshopType}`);
      res.json({ success: true, message: 'Feedback deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save feedback data' });
    }
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  await initializeDataFile();
  
  app.listen(PORT, () => {
    console.log(`Feedback server running on http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  GET    /api/feedback - Get all feedback data`);
    console.log(`  POST   /api/feedback - Submit new feedback`);
    console.log(`  GET    /api/feedback/:workshopType - Get feedback for specific workshop`);
    console.log(`  DELETE /api/feedback/:workshopType/:id - Delete specific feedback entry`);
    console.log(`  GET    /api/health - Health check`);
  });
}

startServer().catch(console.error);
