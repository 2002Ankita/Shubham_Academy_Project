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

The frontend and backend are separate applications. Both need to be running simultaneously.

### 0. Ensure MongoDB is Running
MongoDB must be running on your local machine (`mongodb://localhost:27017`):
```powershell
net start MongoDB
```
*(Or verify the service is running in Windows Services or MongoDB Compass)*

---

### 1. Backend (FastAPI + Python)

Open a PowerShell terminal:
```powershell
cd backend

# If setting up for the first time:
python -m venv venv

# Activate virtual environment:
.\venv\Scripts\Activate.ps1

# Always install/update dependencies after pulling main (e.g. openpyxl, etc.):
pip install -r requirements.txt

# (Optional) Copy environment template if you want custom configs:
# cp .env.example .env

# Run the backend server (runs on port 8000):
python app.py
```

> **Note**: Default seed accounts (`admin@shubham.edu`, `priya.k@shubham.edu`, `aarav.d@shubham.edu`, `superadmin@shubham.edu`) are automatically created if the database is fresh.

---

### 2. Frontend (React + Vite)

Open a second PowerShell terminal:
```powershell
cd frontend
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

### Default Credentials
- **Academy Admin**: `admin@shubham.edu` | Password: `password123`
- **Teacher**: `priya.k@shubham.edu` | Password: `password123`
- **Student**: `aarav.d@shubham.edu` | Password: `9876500001`
- **SuperAdmin**: `superadmin@shubham.edu` | Password: `password123`
