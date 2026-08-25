@echo off
cd /d "%~dp0"

echo Starting local Jekyll server...
echo When it is ready, open http://127.0.0.1:4000/
echo Press Ctrl+C to stop the server.
echo.

call jekyll serve --source jekyll --destination www
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" (
  echo Jekyll exited with error code %EXIT_CODE%.
  echo The window is staying open so you can read the error above.
)
pause
