@echo off
echo ===================================================
echo   Starting Shubham Academy Management System
echo ===================================================
echo.
echo Launching Backend (FastAPI on http://127.0.0.1:8000)...
start "Shubham Academy - Backend API" "%~dp0run_backend.bat"

echo Launching Frontend (Vite on http://localhost:5173)...
start "Shubham Academy - Frontend" "%~dp0run_frontend.bat"

echo.
echo Both servers have been launched in separate windows!
echo Once Vite is ready, refresh http://localhost:5173 in your browser.
echo.
pause
