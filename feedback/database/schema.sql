-- Feedback table with flexible JSON storage for form data
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workshop_type TEXT NOT NULL CHECK (workshop_type IN ('AI', 'Robotics', 'Mechanical', 'Instructor')),
    form_data TEXT NOT NULL, -- JSON string of all form fields
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Password table for authentication
CREATE TABLE IF NOT EXISTS passwords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    password_hash TEXT NOT NULL,
    password_type TEXT NOT NULL CHECK (password_type IN ('standard', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workshop_type ON feedback(workshop_type);
CREATE INDEX IF NOT EXISTS idx_timestamp ON feedback(timestamp);
CREATE INDEX IF NOT EXISTS idx_workshop_timestamp ON feedback(workshop_type, timestamp);
