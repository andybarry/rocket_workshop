# Feedback System Setup Instructions

This system allows users to submit feedback through a survey form and view the collected data in a spreadsheet format. It can handle hundreds of concurrent users.

## Architecture

- **Frontend**: React application with Vite (runs on port 5174)
- **Backend**: Express.js server (runs on port 3001)
- **Data Storage**: JSON file (`feedback-data.json`)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the System

You have two options:

#### Option A: Start both frontend and backend together
```bash
npm run dev:full
```

#### Option B: Start them separately
```bash
# Terminal 1 - Start the backend server
npm run server

# Terminal 2 - Start the frontend
npm run dev
```

### 3. Access the Application

- **Survey Form**: http://localhost:5174/artificial-intelligence-feedback-survey.html
- **Data View**: http://localhost:5174/feedback-data.html

## How It Works

### Survey Submission Flow
1. User fills out the survey at `/artificial-intelligence-feedback-survey.html`
2. On submit, data is sent to the backend API (`http://localhost:3001/api/feedback`)
3. Backend stores the data in `feedback-data.json`
4. User sees confirmation message

### Data Viewing Flow
1. User visits `/feedback-data.html`
2. Frontend fetches data from backend API (`http://localhost:3001/api/feedback/AI`)
3. Data is displayed in a spreadsheet format
4. Users can refresh to see new submissions

## API Endpoints

- `GET /api/feedback` - Get all feedback data
- `POST /api/feedback` - Submit new feedback
- `GET /api/feedback/:workshopType` - Get feedback for specific workshop (AI, Robotics, Mechanical)
- `GET /api/health` - Health check

## Data Structure

Feedback data is stored in `feedback-data.json` with the following structure:

```json
{
  "AI": [
    {
      "date": "1/15/2025",
      "workshop-location": "Ann Arbor, MI",
      "had-fun": "Strongly Agree",
      "favorite-part": "Learning about neural networks",
      "challenged-appropriately": "Agree",
      "ai-tools-before": "Basic Understanding",
      "ai-tools-after": "Advanced Understanding",
      "neural-networks-before": "Minimal Knowledge",
      "neural-networks-after": "Average Understanding",
      "instructor": "Dr. Smith",
      "instructor-prepared": "Strongly Agree",
      "instructor-knowledgeable": "Strongly Agree",
      "workshop-comparison": "The best so far",
      "comments": "Great workshop!",
      "timestamp": "2025-01-15T10:30:00.000Z",
      "id": "unique-id"
    }
  ],
  "Robotics": [],
  "Mechanical": []
}
```

## Features

### Survey Form
- Responsive design works on all devices (laptop, phone, tablet)
- Form validation ensures at least one question is answered
- Real-time submission to backend
- Error handling for network issues

### Data View
- Spreadsheet-like interface with resizable columns
- Real-time data fetching from backend
- Row count display
- Refresh functionality
- Cell locking for data protection

### Backend
- CORS enabled for cross-origin requests
- JSON file storage for simplicity
- Error handling and validation
- Concurrent user support

## Scalability Considerations

For production use with hundreds of concurrent users, consider:

1. **Database**: Replace JSON file with a proper database (PostgreSQL, MongoDB)
2. **Caching**: Add Redis for session management
3. **Load Balancing**: Use multiple server instances
4. **Rate Limiting**: Implement API rate limiting
5. **Monitoring**: Add logging and monitoring tools

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the backend server is running on port 3001
2. **Data Not Loading**: Check if `feedback-data.json` exists and has proper permissions
3. **Port Conflicts**: Ensure ports 3001 and 5174 are available

### Logs

- Backend logs are displayed in the terminal running `npm run server`
- Frontend logs are available in browser developer console

## Security Notes

- This is a development setup
- For production, add authentication, input validation, and HTTPS
- Consider implementing CSRF protection
- Add rate limiting to prevent abuse
