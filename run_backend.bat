@echo off
echo ===================================================
echo   Starting Shubham Academy Backend (FastAPI)
echo ===================================================
cd /d "%~dp0backend"
if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe app.py
) else (
    python app.py
)
pause
