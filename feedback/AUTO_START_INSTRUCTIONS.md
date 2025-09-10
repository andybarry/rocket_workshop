# Auto-Start Server Instructions

## Quick Start (Recommended)

Simply run:
```bash
npm run dev
```

This will automatically start both the frontend and backend servers. The backend server will start automatically when you visit the feedback data page.

## What's New

- **Auto-Start Backend**: The backend server now starts automatically when you run `npm run dev`
- **No Manual Setup**: You no longer need to run `start.bat` or manually start the server
- **Automatic Detection**: The system detects if the server is running and starts it if needed

## How It Works

1. When you run `npm run dev`, Vite starts the frontend server
2. A custom Vite plugin automatically detects if the backend server is running
3. If the backend server is not running, it starts it automatically
4. The feedback data page will work immediately without manual intervention

## Troubleshooting

If you still see "server may be down" errors:

1. **Wait a moment**: The server may still be starting up (takes 2-3 seconds)
2. **Refresh the page**: The auto-start may need a moment to initialize
3. **Manual fallback**: If auto-start fails, run `start.bat` as a backup

## Manual Start (Backup)

If the auto-start doesn't work, you can still use the manual method:
```bash
start.bat
```

This will open two command windows - one for the backend server and one for the frontend server.

## URLs

- Main page: http://localhost:5174/
- AI Survey: http://localhost:5174/artificial-intelligence-feedback-survey.html
- Robotics Survey: http://localhost:5174/robotics-feedback-survey.html
- Mechanical Survey: http://localhost:5174/mechanical-engineering-feedback-survey.html
- Data Page: http://localhost:5174/feedback-data.html
