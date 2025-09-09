@echo off
echo Starting Feedback System...
echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "node server.js"
timeout /t 3 /nobreak > nul
echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"
echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5174
echo.
echo Survey Form: http://localhost:5174/artificial-intelligence-feedback-survey.html
echo Data View: http://localhost:5174/feedback-data.html
echo.
pause
