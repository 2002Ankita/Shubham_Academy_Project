# Shubham Academy Management System

Comprehensive management system for Shubham Academy, Kolhapur.

## Project Structure

```
Shubham_Academy/
├── frontend/             # React (Vite) frontend application
│   ├── src/              # Application source code (components, pages, services, etc.)
│   ├── public/           # Static assets and images
│   ├── package.json      # Dependencies and scripts
│   └── vite.config.js    # Vite configuration
```

## Getting Started on Windows

The frontend and backend are separate applications. Start each in its own PowerShell terminal.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

### Backend

```powershell
cd backend
.\venv\Scripts\python.exe app.py
```

Do not run `npm run dev` from `backend`; it is a Python application and does not have an npm `package.json`.
