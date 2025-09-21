import express from 'express';
import cors from 'cors';
import FeedbackDB from './database/db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Initialize database
const feedbackDB = new FeedbackDB();

// Middleware
app.use(cors({
  origin: [
    'https://input.stageoneeducation.com',
    'http://localhost:5174', 
    'http://127.0.0.1:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

app.use(express.json());

// Serve static files from the built frontend
app.use(express.static(join(__dirname, 'dist')));

// Routes

// Get all feedback data
app.get('/api/feedback', async (req, res) => {
  try {
    const data = feedbackDB.getAllFeedback();
    res.json(data);
  } catch (error) {
    console.error('Error getting all feedback:', error);
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

    const result = feedbackDB.insertFeedback(workshopType, feedbackData);
    
    res.json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      id: result.id,
      timestamp: result.timestamp
    });
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
    
    const data = feedbackDB.getFeedbackByWorkshop(workshopType);
    
    console.log(`Returning ${data.length} records for ${workshopType}`);
    res.json(data);
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
    
    const success = feedbackDB.deleteFeedback(parseInt(id), workshopType);
    
    if (success) {
      console.log(`Successfully deleted feedback entry ${id} from ${workshopType}`);
      res.json({ success: true, message: 'Feedback deleted successfully' });
    } else {
      res.status(404).json({ error: 'Feedback entry not found' });
    }
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// New endpoint for statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = feedbackDB.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'SQLite'
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server because of SIGINT...');
  feedbackDB.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server because of SIGTERM...');
  feedbackDB.close();
  process.exit(0);
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Feedback server running on http://localhost:${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Database: SQLite (database/feedback.db)`);
  console.log(`API endpoints:`);
  console.log(`  GET    /api/feedback - Get all feedback data`);
  console.log(`  POST   /api/feedback - Submit new feedback`);
  console.log(`  GET    /api/feedback/:workshopType - Get feedback for specific workshop`);
  console.log(`  DELETE /api/feedback/:workshopType/:id - Delete specific feedback entry`);
  console.log(`  GET    /api/stats - Get feedback statistics`);
  console.log(`  GET    /api/health - Health check`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Please check what process is using this port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
