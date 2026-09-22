# Shubham Academy - Academy Management System Frontend

Scalable React frontend for the Academy Management System, strictly aligned with the FastAPI backend and architectural specification.

## 1. Technology Stack
- **Frontend Framework**: React (Vite)
- **Routing**: React Router DOM
- **API Communication**: Axios with JWT Bearer request interceptors
- **State Management**: Context API (`AuthContext`)
- **Forms & Validation**: React Hook Form
- **Charts & Visualizations**: Recharts
- **UI & Layout**: Bootstrap 5 with custom CSS design tokens
- **Icons & Alerts**: Lucide React and React Toastify
- **Authentication**: JWT with role-based protected routes (`super-admin`, `admin`, `teacher`, `student`)

## 2. Shubham Academy Theme Tokens
| Theme Token | Colour Code | Recommended Use |
|---|---|---|
| Primary Red | `#A91F1F` | Sidebar, primary buttons, and active navigation |
| Dark Red | `#7D1515` | Hover states and strong emphasis |
| Mustard Yellow | `#D5A61C` | Highlights, icons, and branding accents |
| Warm Orange | `#D97718` | Warnings and secondary highlights |
| Off White | `#F7F4EE` | Application background |
| White | `#FFFFFF` | Cards, forms, and tables |
| Charcoal | `#252525` | Primary text |
| Success Green | `#168554` | Successful and active status |
| Border | `#E7E2DA` | Inputs, tables, and card borders |

## 3. Role-Based Access Control (RBAC)

### Common
- `/login` - Multi-role sign in
- `/forgot-password` - Password recovery
- `/reset-password` - Set new password
- `/unauthorized` - 403 Access denied

### Super Admin
- `/super-admin/dashboard` - Global multi-campus control plane
- `/super-admin/academies` - Campus branch management
- `/super-admin/users` - Global user directory & RBAC
- `/super-admin/reports` - Consolidated organizational reports
- `/super-admin/audit-logs` - Immutable system audit logs & security telemetry
- `/super-admin/settings` - Platform settings & backend integration

### Academy Admin
- `/admin/dashboard` - Academy operational overview
- `/admin/students` - Student directory
- `/admin/students/register` - Student admission & RFID badge allocation
- `/admin/students/:id` - Detailed student profile
- `/admin/teachers` - Faculty directory
- `/admin/teachers/add` - Faculty onboarding
- `/admin/teachers/salary` - Faculty payroll & NEFT disbursals
- `/admin/attendance` - Live RFID gate scanner terminal & access logs
- `/admin/attendance/report` - Batch-wise attendance reports
- `/admin/fees` - Fee collection counter & instant receipts
- `/admin/fees/pending` - Outstanding dues & automated SMS reminders
- `/admin/fees/receipt` - Official printable fee receipt
- `/admin/exams` - Examination scheduler & timetable
- `/admin/marks/entry` - Exam marks recording sheet
- `/admin/results` - Merit lists & leaderboard
- `/admin/notes/stock` - Printed book stock & inventory reorder thresholds
- `/admin/notes/delivery` - Student textbook delivery & counter pickup
- `/admin/notices` - Notice board & circulars broadcast
- `/admin/notifications` - System notifications
- `/admin/reports` - Downloadable reports

### Teacher
- `/teacher/dashboard` - Faculty timetable & teaching overview
- `/teacher/classes` - Allocated teaching batches
- `/teacher/students` - Batch student directory
- `/teacher/attendance` - Classroom attendance roll call
- `/teacher/exams` - Assigned examinations
- `/teacher/marks` - Marks entry portal
- `/teacher/study-materials` - Upload lecture notes & PDF problem banks
- `/teacher/announcements` - Post class announcements
- `/teacher/profile` - Faculty credentials & profile

### Student
- `/student/dashboard` - Academic overview & quick status
- `/student/classes` - Weekly class schedule & timetable
- `/student/attendance` - RFID gate entry logs & presence record
- `/student/fees` - Tuition payments & fee receipts
- `/student/exams` - Upcoming exam schedule & hall allocations
- `/student/results` - Academic scorecard & rank
- `/student/study-materials` - Download chapter notes & question banks
- `/student/notes-delivery` - Track physical workbook packets
- `/student/announcements` - Academy circulars & bulletins
- `/student/profile` - Personal info & linked RFID smart card

## 4. Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Build production bundle
npm run build
```
