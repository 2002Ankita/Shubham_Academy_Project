SHUBHAM ACADEMY MANAGEMENT SYSTEM (SAMS)SHUBHAM ACADEMY MANAGEMENT SYSTEM (SAMS)SHUBHAM ACADEMY MANAGEMENT SYSTEM (SAMS)

Comprehensive System Architecture, Technical Specifications & User GuideComprehensive System Architecture, Technical Specifications & User GuideComprehensive System Architecture, Technical Specifications & User Guide


| Project Name | Shubham Academy Enterprise Multi-Campus Management System |
| --- | --- |
| Version & Release | v2.4.0 (Production Release) |
| Date of Publication | November 2026 |
| Campus Deployment | Tarabai Park Campus & Mangalvar Peth Campus, Kolhapur |



## 1. Executive Summary1. Executive Summary1. Executive Summary

Shubham Academy Management System (SAMS) is an enterprise-grade ERP, LMS, and Student Information System custom-built for coaching institutes specializing in 11th and 12th Science (PCM, PCB, PCMB), CET, JEE, and NEET preparation. The platform delivers complete end-to-end automation for academic operations across multiple physical branches with full campus data isolation, real-time synchronization, role-based security, automated fee recovery schedulers, dual-session lecture attendance tracking, and physical study module inventory registers.Shubham Academy Management System (SAMS) is an enterprise-grade ERP, LMS, and Student Information System custom-built for coaching institutes specializing in 11th and 12th Science (PCM, PCB, PCMB), CET, JEE, and NEET preparation. The platform delivers complete end-to-end automation for academic operations across multiple physical branches with full campus data isolation, real-time synchronization, role-based security, automated fee recovery schedulers, dual-session lecture attendance tracking, and physical study module inventory registers.Shubham Academy Management System (SAMS) is an enterprise-grade ERP, LMS, and Student Information System custom-built for coaching institutes specializing in 11th and 12th Science (PCM, PCB, PCMB), CET, JEE, and NEET preparation. The platform delivers complete end-to-end automation for academic operations across multiple physical branches with full campus data isolation, real-time synchronization, role-based security, automated fee recovery schedulers, dual-session lecture attendance tracking, and physical study module inventory registers.


## 2. Core Architecture Principles2. Core Architecture Principles2. Core Architecture Principles

Strict Multi-Campus Isolation: Administrative and faculty staff assigned to Mangalvar Peth or Tarabai Park only view and operate on students, batches, fee transactions, and book inventories belonging to their physical campus. Zero cross-campus data leakage is guaranteed.Strict Multi-Campus Isolation: Strict Multi-Campus Isolation: Administrative and faculty staff assigned to Mangalvar Peth or Tarabai Park only view and operate on students, batches, fee transactions, and book inventories belonging to their physical campus. Zero cross-campus data leakage is guaranteed.Administrative and faculty staff assigned to Mangalvar Peth or Tarabai Park only view and operate on students, batches, fee transactions, and book inventories belonging to their physical campus. Zero cross-campus data leakage is guaranteed.

Super Admin Unified Governance: The Managing Director (Super Admin) maintains single-pane centralized oversight, real-time aggregate financials, global fee concession approvals, and cross-campus switcher controls.Super Admin Unified Governance: Super Admin Unified Governance: The Managing Director (Super Admin) maintains single-pane centralized oversight, real-time aggregate financials, global fee concession approvals, and cross-campus switcher controls.The Managing Director (Super Admin) maintains single-pane centralized oversight, real-time aggregate financials, global fee concession approvals, and cross-campus switcher controls.

Dual-Lecture Tracking Engine: Supports daily morning (Lecture 1) and afternoon (Lecture 2) logging. Lectures and student enrollments are batch-synchronized to ensure 100% accurate attendance calculations.Dual-Lecture Tracking Engine: Dual-Lecture Tracking Engine: Supports daily morning (Lecture 1) and afternoon (Lecture 2) logging. Lectures and student enrollments are batch-synchronized to ensure 100% accurate attendance calculations.Supports daily morning (Lecture 1) and afternoon (Lecture 2) logging. Lectures and student enrollments are batch-synchronized to ensure 100% accurate attendance calculations.

Standard-Separated Book Inventory: Provides dedicated physical stock management for 11th Science and 12th Science across Theory and CET books for Physics, Chemistry, Mathematics, and Biology with handover slips and barcode/SKU tracking.Standard-Separated Book Inventory: Standard-Separated Book Inventory: Provides dedicated physical stock management for 11th Science and 12th Science across Theory and CET books for Physics, Chemistry, Mathematics, and Biology with handover slips and barcode/SKU tracking.Provides dedicated physical stock management for 11th Science and 12th Science across Theory and CET books for Physics, Chemistry, Mathematics, and Biology with handover slips and barcode/SKU tracking.


## 3. Technology Stack Specifications3. Technology Stack Specifications3. Technology Stack Specifications


| Layer / Component | Technology / Framework | Key Purpose |
| --- | --- | --- |
| Frontend Client | React 18.3, Vite 6.0, Bootstrap 5.3 | Ultra-fast single-page application with responsive layouts, modals, and dynamic filters. |
| Frontend Routing & State | React Router v6, Context API, Hooks | Role-based route guarding (Super Admin, Admin, Teacher, Student) and token lifecycle. |
| UI Components & Icons | Lucide React, Recharts, Custom Theme | Responsive dashboards, SVG icons, chart visualizations, printable fee/book vouchers. |
| Backend Web Framework | Python 3.14, FastAPI (Asynchronous) | High-throughput asynchronous REST APIs with auto OpenAPI/Swagger documentation. |
| Database Engine | MongoDB (NoSQL Document Store) | Scalable document store supporting dynamic schemas, nested objects, and fast aggregation. |
| ORM / ODM Layer | Beanie ODM, Motor, PyMongo | Asynchronous Python Object-Document Mapper built on Pydantic v2 validation. |
| Security & Auth | OAuth2 Password Flow, JWT (HS256), BCrypt | Stateless JSON Web Tokens with 30-day expiry, cryptographic password hashing. |
| Background Automation | APScheduler (Advanced Python Scheduler) | Automated payment reminder engines, syllabus topic duration tracking, and sync jobs. |



## 4. User Roles & Permission Matrix4. User Roles & Permission Matrix4. User Roles & Permission Matrix


| Role Name | Scope of Access | Primary Permissions & Capabilities |
| --- | --- | --- |
| Super Administrator | Cross-Campus (Global) | Managing Director dashboard, multi-campus toggling, concession & discount approvals, staff salary processing, database audits, fee settings. |
| Campus Administrator | Branch Specific (Mangalvar Peth OR Tarabai Park) | Student admissions, cash/counter fee receipts, batch timetable, classroom attendance register, books stock editing/restock/handover, circular broadcasts. |
| Teacher / Faculty | Assigned Batches & Classes | Daily activity reporting, topic duration tracking, lecture 1 & 2 attendance marking, exam marks entry, study material uploads, salary slip views, leave requests. |
| Student / Parent | Personal Account Only | View timetable, personalized attendance percentage & lecture attended counters, report cards, fee payment dues/receipts, distributed book material register. |



## 5. Functional Modules Breakdown5. Functional Modules Breakdown5. Functional Modules Breakdown


## 5.1. Student Enrollment & Admissions5.1. Student Enrollment & Admissions5.1. Student Enrollment & Admissions

Supports dynamic registration with auto-generated student IDs (STD-XXX). Allows configuring academic streams (11th PCM, 11th PCB, 11th PCMB, 12th PCM, 12th PCB, 12th PCMB), morning vs. evening sessions, campus locker assignments, parent contact details, and initial payment installment options.Supports dynamic registration with auto-generated student IDs (STD-XXX). Allows configuring academic streams (11th PCM, 11th PCB, 11th PCMB, 12th PCM, 12th PCB, 12th PCMB), morning vs. evening sessions, campus locker assignments, parent contact details, and initial payment installment options.Supports dynamic registration with auto-generated student IDs (STD-XXX). Allows configuring academic streams (11th PCM, 11th PCB, 11th PCMB, 12th PCM, 12th PCB, 12th PCMB), morning vs. evening sessions, campus locker assignments, parent contact details, and initial payment installment options.


## 5.2. Fee Collection & Payment Accounting5.2. Fee Collection & Payment Accounting5.2. Fee Collection & Payment Accounting

Features combined two-year fee calculation rules, predefined discount scholarship presets (₹2,000 to ₹20,000), administrative approval logs, cash/counter fee receipt generation with printable slips, pending fee defaulter lists, and automated SMS/WhatsApp fee reminder schedulers.Features combined two-year fee calculation rules, predefined discount scholarship presets (₹2,000 to ₹20,000), administrative approval logs, cash/counter fee receipt generation with printable slips, pending fee defaulter lists, and automated SMS/WhatsApp fee reminder schedulers.Features combined two-year fee calculation rules, predefined discount scholarship presets (₹2,000 to ₹20,000), administrative approval logs, cash/counter fee receipt generation with printable slips, pending fee defaulter lists, and automated SMS/WhatsApp fee reminder schedulers.


## 5.3. Attendance & Lecture Tracking System5.3. Attendance & Lecture Tracking System5.3. Attendance & Lecture Tracking System

Tracks attendance on an independent dual-lecture model (Morning Lecture 1 & Afternoon Lecture 2). Attendance rates are calculated accurately across active batch students, correctly distinguishing between individual student names rather than generic student numbers, and automatically highlighting attendance defaulters falling below the mandatory 75% threshold.Tracks attendance on an independent dual-lecture model (Morning Lecture 1 & Afternoon Lecture 2). Attendance rates are calculated accurately across active batch students, correctly distinguishing between individual student names rather than generic student numbers, and automatically highlighting attendance defaulters falling below the mandatory 75% threshold.Tracks attendance on an independent dual-lecture model (Morning Lecture 1 & Afternoon Lecture 2). Attendance rates are calculated accurately across active batch students, correctly distinguishing between individual student names rather than generic student numbers, and automatically highlighting attendance defaulters falling below the mandatory 75% threshold.


## 5.4. Books Stock & Handover Tracking Register5.4. Books Stock & Handover Tracking Register5.4. Books Stock & Handover Tracking Register

Manages physical study packages categorized into 11th and 12th standards for both Theory and CET editions across Physics, Chemistry, Mathematics, and Biology. Provides an inline stock editor for administrators to adjust inventory counts and reorder thresholds, quick restock vouchers (+10, +25, +50, +100 copies), and a searchable handover register that records recipient students, handover dates, faculty verifiers, and printable distribution vouchers.Manages physical study packages categorized into 11th and 12th standards for both Theory and CET editions across Physics, Chemistry, Mathematics, and Biology. Provides an inline stock editor for administrators to adjust inventory counts and reorder thresholds, quick restock vouchers (+10, +25, +50, +100 copies), and a searchable handover register that records recipient students, handover dates, faculty verifiers, and printable distribution vouchers.Manages physical study packages categorized into 11th and 12th standards for both Theory and CET editions across Physics, Chemistry, Mathematics, and Biology. Provides an inline stock editor for administrators to adjust inventory counts and reorder thresholds, quick restock vouchers (+10, +25, +50, +100 copies), and a searchable handover register that records recipient students, handover dates, faculty verifiers, and printable distribution vouchers.


## 5.5. Faculty Syllabus & Topic Duration Planner5.5. Faculty Syllabus & Topic Duration Planner5.5. Faculty Syllabus & Topic Duration Planner

Allows teachers to log lecture topics, duration hours spent, teaching methodology, student doubts addressed, and curriculum milestones. Produces consolidated syllabus pacing reports for administrators to review class progress across both campuses.Allows teachers to log lecture topics, duration hours spent, teaching methodology, student doubts addressed, and curriculum milestones. Produces consolidated syllabus pacing reports for administrators to review class progress across both campuses.Allows teachers to log lecture topics, duration hours spent, teaching methodology, student doubts addressed, and curriculum milestones. Produces consolidated syllabus pacing reports for administrators to review class progress across both campuses.


## 5.6. Examination & Grade Card Management5.6. Examination & Grade Card Management5.6. Examination & Grade Card Management

Supports scheduling unit tests, terminal examinations, and full-length CET/JEE/NEET mock tests. Includes batch marks entry tables with auto-calculated total percentages, class ranks, subject-wise analytics, and downloadable Excel mark sheets.Supports scheduling unit tests, terminal examinations, and full-length CET/JEE/NEET mock tests. Includes batch marks entry tables with auto-calculated total percentages, class ranks, subject-wise analytics, and downloadable Excel mark sheets.Supports scheduling unit tests, terminal examinations, and full-length CET/JEE/NEET mock tests. Includes batch marks entry tables with auto-calculated total percentages, class ranks, subject-wise analytics, and downloadable Excel mark sheets.


## 6. MongoDB Collections & Schemas6. MongoDB Collections & Schemas6. MongoDB Collections & Schemas


| Collection Name | Model Entity | Description & Key Attributes |
| --- | --- | --- |
| users | User | Authentication credentials, full name, role (superadmin/admin/teacher/student), campus, status. |
| students | Student | Roll number, student_id, batch, standard, session, campus branch, admission date, parent phone. |
| teachers | Teacher | Faculty designation, subjects taught, branch, base salary, hourly rate, contact info. |
| batches | Batch | Class name, standard (11th/12th), stream (PCM/PCB/PCMB), session (Morning/Evening), branch. |
| attendance | Attendance | Student reference, date, session (Morning/Afternoon), lecture number (1 or 2), status (Present/Absent). |
| inventory_items | InventoryItem | Book title, category (Theory/CET), subject, standard (11th/12th Science), branch, in_stock, total_stock, reorder_level, unit_cost. |
| inventory_deliveries | InventoryDelivery | Item ref, student ref, book title, quantity, date, handed_over_by, recipient_name, branch, remarks. |
| fee_payments | FeePayment | Student ref, amount paid, payment mode (Cash/UPI/Bank), receipt_no, transaction_date, collector. |
| discount_approvals | DiscountApproval | Student ref, concession amount, reason, authorized by, status (Pending/Approved/Rejected). |
| daily_activities | DailyActivity | Teacher ref, date, batch, subject, topics covered, duration, start/end time, branch. |
| exams | Exam | Title, subject, standard, date, max marks, passing marks, branch, academic year. |
| marks | Marks | Exam ref, student ref, marks obtained, percentage, grade, feedback. |



## 7. Local Development & Deployment Guide7. Local Development & Deployment Guide7. Local Development & Deployment Guide

Follow the steps below to run Shubham Academy Management System locally or on a production server:Follow the steps below to run Shubham Academy Management System locally or on a production server:Follow the steps below to run Shubham Academy Management System locally or on a production server:


## 7.1. Prerequisites7.1. Prerequisites7.1. Prerequisites

Node.js (v18.0.0 or higher) and npmNode.js (v18.0.0 or higher) and npmNode.js (v18.0.0 or higher) and npm

Python 3.11, 3.12, or 3.14Python 3.11, 3.12, or 3.14Python 3.11, 3.12, or 3.14

MongoDB Server running locally on port 27017 or MongoDB Atlas connection URIMongoDB Server running locally on port 27017 or MongoDB Atlas connection URIMongoDB Server running locally on port 27017 or MongoDB Atlas connection URI


## 7.2. Backend Setup7.2. Backend Setup7.2. Backend Setup


## 1. Open terminal and navigate to backend directory:
   cd backend
2. Create and activate a Python virtual environment:
   python -m venv venv
   .\venv\Scripts\activate   (Windows) or source venv/bin/activate (Linux/Mac)
3. Install required packages:
   pip install -r requirements.txt
4. Configure environment variables in backend/.env:
   MONGODB_URL=mongodb://127.0.0.1:27017
   DATABASE_NAME=academy_management
   SECRET_KEY=shubham_academy_super_secret_key_dev_2026
5. Start the backend server:
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload1. Open terminal and navigate to backend directory:
   cd backend
2. Create and activate a Python virtual environment:
   python -m venv venv
   .\venv\Scripts\activate   (Windows) or source venv/bin/activate (Linux/Mac)
3. Install required packages:
   pip install -r requirements.txt
4. Configure environment variables in backend/.env:
   MONGODB_URL=mongodb://127.0.0.1:27017
   DATABASE_NAME=academy_management
   SECRET_KEY=shubham_academy_super_secret_key_dev_2026
5. Start the backend server:
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload1. Open terminal and navigate to backend directory:   cd backend2. Create and activate a Python virtual environment:   python -m venv venv   .\venv\Scripts\activate   (Windows) or source venv/bin/activate (Linux/Mac)3. Install required packages:   pip install -r requirements.txt4. Configure environment variables in backend/.env:   MONGODB_URL=mongodb://127.0.0.1:27017   DATABASE_NAME=academy_management   SECRET_KEY=shubham_academy_super_secret_key_dev_20265. Start the backend server:   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload


## 7.3. Frontend Setup7.3. Frontend Setup7.3. Frontend Setup


## 1. Open a new terminal and navigate to frontend directory:
   cd frontend
2. Install npm dependencies:
   npm install
3. Start Vite local development server:
   npm run dev
4. Open web browser at http://localhost:5173
5. Production build command:
   npm run build1. Open a new terminal and navigate to frontend directory:
   cd frontend
2. Install npm dependencies:
   npm install
3. Start Vite local development server:
   npm run dev
4. Open web browser at http://localhost:5173
5. Production build command:
   npm run build1. Open a new terminal and navigate to frontend directory:   cd frontend2. Install npm dependencies:   npm install3. Start Vite local development server:   npm run dev4. Open web browser at http://localhost:51735. Production build command:   npm run build


## 8. Project Directory Structure8. Project Directory Structure8. Project Directory Structure

Shubham_Academy_Project/
├── backend/
│   ├── app/
│   │   ├── core/         # Database, branch configuration, security & scheduler
│   │   ├── models/       # Beanie/MongoDB document schemas (23 entities)
│   │   ├── routers/      # REST API route controllers
│   │   ├── schemas/      # Pydantic validation request/response schemas
│   │   ├── services/     # Business logic (attendance, fees, inventory, etc.)
│   │   └── main.py       # FastAPI application entry point
│   ├── venv/             # Python isolated virtual environment
│   └── requirements.txt  # Python package dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI controls (Table, Modal, Input, Button, etc.)
│   │   ├── config/       # Branch and batch definitions
│   │   ├── context/      # AuthContext, ConfirmContext
│   │   ├── pages/        # Views partitioned by role:
│   │   │   ├── admin/    # BooksStock, Dashboard, AttendanceReport, etc.
│   │   │   ├── student/  # Fees, Results, BooksDelivery, MyClasses, etc.
│   │   │   ├── super-admin/ # Dashboard, Settings, Approvals, etc.
│   │   │   └── teacher/  # DailyActivityReport, TopicDurationPlanner, etc.
│   │   ├── services/     # Axios API service clients
│   │   └── styles/       # theme.css design tokens and index.css
│   ├── package.json      # Frontend package configuration
│   └── vite.config.js    # Vite bundler configuration
└── README.md
Shubham_Academy_Project/
├── backend/
│   ├── app/
│   │   ├── core/         # Database, branch configuration, security & scheduler
│   │   ├── models/       # Beanie/MongoDB document schemas (23 entities)
│   │   ├── routers/      # REST API route controllers
│   │   ├── schemas/      # Pydantic validation request/response schemas
│   │   ├── services/     # Business logic (attendance, fees, inventory, etc.)
│   │   └── main.py       # FastAPI application entry point
│   ├── venv/             # Python isolated virtual environment
│   └── requirements.txt  # Python package dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI controls (Table, Modal, Input, Button, etc.)
│   │   ├── config/       # Branch and batch definitions
│   │   ├── context/      # AuthContext, ConfirmContext
│   │   ├── pages/        # Views partitioned by role:
│   │   │   ├── admin/    # BooksStock, Dashboard, AttendanceReport, etc.
│   │   │   ├── student/  # Fees, Results, BooksDelivery, MyClasses, etc.
│   │   │   ├── super-admin/ # Dashboard, Settings, Approvals, etc.
│   │   │   └── teacher/  # DailyActivityReport, TopicDurationPlanner, etc.
│   │   ├── services/     # Axios API service clients
│   │   └── styles/       # theme.css design tokens and index.css
│   ├── package.json      # Frontend package configuration
│   └── vite.config.js    # Vite bundler configuration
└── README.md
Shubham_Academy_Project/├── backend/│   ├── app/│   │   ├── core/         # Database, branch configuration, security & scheduler│   │   ├── models/       # Beanie/MongoDB document schemas (23 entities)│   │   ├── routers/      # REST API route controllers│   │   ├── schemas/      # Pydantic validation request/response schemas│   │   ├── services/     # Business logic (attendance, fees, inventory, etc.)│   │   └── main.py       # FastAPI application entry point│   ├── venv/             # Python isolated virtual environment│   └── requirements.txt  # Python package dependencies├── frontend/│   ├── src/│   │   ├── components/   # Reusable UI controls (Table, Modal, Input, Button, etc.)│   │   ├── config/       # Branch and batch definitions│   │   ├── context/      # AuthContext, ConfirmContext│   │   ├── pages/        # Views partitioned by role:│   │   │   ├── admin/    # BooksStock, Dashboard, AttendanceReport, etc.│   │   │   ├── student/  # Fees, Results, BooksDelivery, MyClasses, etc.│   │   │   ├── super-admin/ # Dashboard, Settings, Approvals, etc.│   │   │   └── teacher/  # DailyActivityReport, TopicDurationPlanner, etc.│   │   ├── services/     # Axios API service clients│   │   └── styles/       # theme.css design tokens and index.css│   ├── package.json      # Frontend package configuration│   └── vite.config.js    # Vite bundler configuration└── README.md
