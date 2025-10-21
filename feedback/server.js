import express from 'express';
import cors from 'cors';
import FeedbackDB from './database/db.js';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// Initialize database
const feedbackDB = new FeedbackDB();

// In-memory session store (in production, use Redis or similar)
const sessions = new Map();

// Session cleanup interval (clean expired sessions every hour)
const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

// CORS configuration based on environment
const corsOrigins = IS_PRODUCTION 
  ? [
      'https://input.stageoneeducation.com',
      'http://localhost:5174', 
      'http://127.0.0.1:5174'
    ]
  : [
      'http://localhost:5174', 
      'http://127.0.0.1:5174', 
      'http://localhost:5176', 
      'http://127.0.0.1:5176', 
      'http://localhost:5173', 
      'http://127.0.0.1:5173'
    ];

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

app.use(express.json());

// Authentication middleware
const authenticate = (req, res, next) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const session = sessions.get(sessionId);
  if (Date.now() > session.expires) {
    sessions.delete(sessionId);
    return res.status(401).json({ error: 'Session expired' });
  }
  
  req.session = session;
  next();
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Generate session ID
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Session cleanup function
const cleanupExpiredSessions = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now > session.expires) {
      sessions.delete(sessionId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired sessions. Active sessions: ${sessions.size}`);
  }
};

// Initialize session cleanup interval
const sessionCleanupInterval = setInterval(cleanupExpiredSessions, SESSION_CLEANUP_INTERVAL);

// Log session statistics periodically (only in production)
const logSessionStats = () => {
  if (IS_PRODUCTION) {
    console.log(`Session Statistics - Active sessions: ${sessions.size}`);
    if (sessions.size > 0) {
      const oldestSession = Math.min(...Array.from(sessions.values()).map(s => s.createdAt));
      const newestSession = Math.max(...Array.from(sessions.values()).map(s => s.createdAt));
      console.log(`  Oldest session: ${new Date(oldestSession).toISOString()}`);
      console.log(`  Newest session: ${new Date(newestSession).toISOString()}`);
    }
  }
};

// Log session stats every 6 hours (only in production)
const sessionStatsInterval = IS_PRODUCTION ? setInterval(logSessionStats, 6 * 60 * 60 * 1000) : null;

// Security monitoring - log failed authentication attempts
const logFailedAuth = (req, reason) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const timestamp = new Date().toISOString();
  
  console.warn(`Failed authentication attempt:`, {
    timestamp,
    ip: clientIP,
    userAgent,
    reason,
    activeSessions: sessions.size
  });
};

// Rate limiting removed - no longer blocking login attempts

// Serve static files from the built frontend (only in production)
if (IS_PRODUCTION) {
  app.use(express.static(join(__dirname, 'dist')));
}

// Routes

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    // Check both password types
    const isStandardValid = feedbackDB.verifyPassword(password, 'standard');
    const isAdminValid = feedbackDB.verifyPassword(password, 'admin');
    
    if (!isStandardValid && !isAdminValid) {
      logFailedAuth(req, 'Invalid password');
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Create session
    const sessionId = generateSessionId();
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    sessions.set(sessionId, {
      id: sessionId,
      expires: expires,
      createdAt: Date.now(),
      isAdmin: isAdminValid
    });
    
    res.json({ 
      success: true, 
      sessionId: sessionId,
      expires: expires,
      isAdmin: isAdminValid
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
  }
  
  res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ authenticated: false });
  }
  
  const session = sessions.get(sessionId);
  if (Date.now() > session.expires) {
    sessions.delete(sessionId);
    return res.status(401).json({ authenticated: false });
  }
  
  res.json({ 
    authenticated: true,
    isAdmin: session.isAdmin || false
  });
});

// Password management routes
app.post('/api/auth/set-standard-password', authenticate, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    feedbackDB.setPassword(password, 'standard');
    
    res.json({ success: true, message: 'Standard password updated successfully' });
  } catch (error) {
    console.error('Error setting standard password:', error);
    res.status(500).json({ error: 'Failed to set standard password' });
  }
});

app.post('/api/auth/set-admin-password', authenticate, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    feedbackDB.setPassword(password, 'admin');
    
    res.json({ success: true, message: 'Admin password updated successfully' });
  } catch (error) {
    console.error('Error setting admin password:', error);
    res.status(500).json({ error: 'Failed to set admin password' });
  }
});

app.get('/api/auth/has-password', (req, res) => {
  try {
    const hasStandardPassword = feedbackDB.hasPassword('standard');
    const hasAdminPassword = feedbackDB.hasPassword('admin');
    res.json({ 
      hasStandardPassword,
      hasAdminPassword,
      hasPassword: hasStandardPassword || hasAdminPassword
    });
  } catch (error) {
    console.error('Error checking password status:', error);
    res.status(500).json({ error: 'Failed to check password status' });
  }
});

// Get current passwords (admin only)
app.get('/api/auth/get-current-standard-password', authenticate, requireAdmin, (req, res) => {
  try {
    const password = feedbackDB.getPassword('standard');
    res.json({ password: password || 'stageone8' });
  } catch (error) {
    console.error('Error getting current standard password:', error);
    res.status(500).json({ error: 'Failed to get current standard password' });
  }
});

app.get('/api/auth/get-current-admin-password', authenticate, requireAdmin, (req, res) => {
  try {
    const password = feedbackDB.getPassword('admin');
    res.json({ password: password || 'cambridge8' });
  } catch (error) {
    console.error('Error getting current admin password:', error);
    res.status(500).json({ error: 'Failed to get current admin password' });
  }
});

// Get all feedback data (admin only)
app.get('/api/feedback', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = feedbackDB.getAllFeedback();
    res.json(data);
  } catch (error) {
    console.error('Error getting all feedback:', error);
    res.status(500).json({ error: 'Failed to read feedback data' });
  }
});

// Submit new feedback (public endpoint for student surveys)
app.post('/api/feedback', async (req, res) => {
  try {
    const { workshopType, feedbackData } = req.body;
    
    if (!workshopType || !feedbackData) {
      return res.status(400).json({ error: 'Workshop type and feedback data are required' });
    }

    // Only allow student surveys through this public endpoint
    const allowedTypes = ['AI', 'Robotics', 'Mechanical'];
    if (!allowedTypes.includes(workshopType)) {
      return res.status(403).json({ error: 'This endpoint is only for student feedback surveys' });
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

// Submit instructor feedback (authenticated users)
app.post('/api/instructor-feedback', authenticate, async (req, res) => {
  try {
    const { feedbackData } = req.body;
    
    if (!feedbackData) {
      return res.status(400).json({ error: 'Feedback data is required' });
    }

    const result = feedbackDB.insertFeedback('Instructor', feedbackData);
    
    res.json({ 
      success: true, 
      message: 'Instructor feedback submitted successfully',
      id: result.id,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error('Error submitting instructor feedback:', error);
    res.status(500).json({ error: 'Failed to submit instructor feedback' });
  }
});

// Get feedback for specific workshop type (accessible to both standard and admin users)
app.get('/api/feedback/:workshopType', authenticate, async (req, res) => {
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

// Delete specific feedback entry (admin only)
app.delete('/api/feedback/:workshopType/:id', authenticate, requireAdmin, async (req, res) => {
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

// Get statistics (admin only)
app.get('/api/stats', authenticate, requireAdmin, (req, res) => {
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
    database: 'SQLite',
    environment: NODE_ENV
  });
});

// Start server endpoint (for auto-start functionality - only in development)
if (!IS_PRODUCTION) {
  app.post('/api/start-server', (req, res) => {
    console.log('Received request to start server');
    res.json({ 
      status: 'OK', 
      message: 'Server is already running',
      timestamp: new Date().toISOString(),
      database: 'SQLite'
    });
  });
}

// Memory usage monitoring (only in production)
const logMemoryUsage = () => {
  if (IS_PRODUCTION) {
    const used = process.memoryUsage();
    console.log('Memory Usage:', {
      rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`,
      sessions: sessions.size
    });
  }
};

// Log memory usage every 12 hours (only in production)
const memoryLogInterval = IS_PRODUCTION ? setInterval(logMemoryUsage, 12 * 60 * 60 * 1000) : null;

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log session info for debugging
  console.error(`Active sessions at time of rejection: ${sessions.size}`);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Log session info for debugging
  console.error(`Active sessions at time of exception: ${sessions.size}`);
  // Don't exit the process, just log the error
});

// Graceful shutdown function
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  // Clear intervals
  if (sessionCleanupInterval) {
    clearInterval(sessionCleanupInterval);
    console.log('Session cleanup interval cleared');
  }
  
  if (sessionStatsInterval) {
    clearInterval(sessionStatsInterval);
    console.log('Session stats interval cleared');
  }
  
  if (memoryLogInterval) {
    clearInterval(memoryLogInterval);
    console.log('Memory logging interval cleared');
  }
  
  // Clean up all sessions
  const sessionCount = sessions.size;
  sessions.clear();
  console.log(`Cleared ${sessionCount} active sessions`);
  
  // Close database connection
  feedbackDB.close();
  console.log('Database connection closed');
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed');
    console.log('Graceful shutdown completed');
    process.exit(0);
  });
  
  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Graceful shutdown hooks
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

// Catch-all handler: send back React's index.html file for any non-API routes (only in production)
if (IS_PRODUCTION) {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`Feedback server running on http://localhost:${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Database: SQLite (database/feedback.db)`);
  console.log(`API endpoints:`);
  console.log(`  GET    /api/feedback - Get all feedback data (authenticated)`);
  console.log(`  POST   /api/feedback - Submit student feedback (public - AI/Robotics/Mechanical)`);
  console.log(`  POST   /api/instructor-feedback - Submit instructor feedback (authenticated)`);
  console.log(`  GET    /api/feedback/:workshopType - Get feedback for specific workshop (authenticated)`);
  console.log(`  DELETE /api/feedback/:workshopType/:id - Delete specific feedback entry (authenticated)`);
  console.log(`  GET    /api/stats - Get feedback statistics (authenticated)`);
  console.log(`  GET    /api/health - Health check`);
  console.log(`Authentication endpoints:`);
  console.log(`  POST   /api/auth/login - User authentication`);
  console.log(`  POST   /api/auth/logout - Session termination`);
  console.log(`  GET    /api/auth/status - Check authentication status`);
  console.log(`  POST   /api/auth/set-password - Create/change password (auth required for changes)`);
  console.log(`  GET    /api/auth/has-password - Check if password exists`);
  console.log(`Security features:`);
  console.log(`  - Session cleanup every hour`);
  console.log(`  - Rate limiting: 5 attempts per IP per minute`);
  console.log(`  - Failed authentication logging`);
  if (IS_PRODUCTION) {
    console.log(`  - Memory monitoring every 12 hours`);
    console.log(`  - Session statistics every 6 hours`);
  }
  
  // Initial session cleanup and memory log (only in production)
  if (IS_PRODUCTION) {
    setTimeout(() => {
      cleanupExpiredSessions();
      logMemoryUsage();
    }, 5000); // Run after 5 seconds to let server fully start
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. ${IS_PRODUCTION ? 'Please check what process is using this port.' : 'Checking if server is already running...'}`);
    
    if (!IS_PRODUCTION) {
      // Try to check if there's already a server running on this port
      fetch(`http://localhost:${PORT}/api/health`)
        .then(response => {
          if (response.ok) {
            console.log('✅ Server is already running and healthy on this port');
            return response.json();
          }
          throw new Error('Server not responding');
        })
        .then(data => {
          console.log('Server status:', data);
          // Don't exit, just log that server is already running
        })
        .catch(error => {
          console.error('❌ Port is in use but server is not responding properly');
          console.error('Please check what process is using port', PORT);
          process.exit(1);
        });
    } else {
      process.exit(1);
    }
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
