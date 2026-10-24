# Multi-Campus Admin Architecture & Implementation Plan
**Shubham Academy: Branch-Specific Super Admin & Academy Admin Isolation**

---

## 1. Executive Summary

### 1.1 Objective
Transform Shubham Academy's administrative portal into a **dual-campus segregated administrative architecture** while **keeping the existing UI design, styling, and colors 100% as it is**:
- **Existing Admins (Mangalvar Peth)**: Scope the existing **Super Admin** (`superadmin@shubham.edu`) and **Academy Admin** (`admin@shubham.edu`) exclusively to the **Mangalvar Peth Campus**.
- **New Cloned Admins (Tarabai Park)**: Create new cloned accounts for **Super Admin** (`superadmin.tarabai@shubham.edu`) and **Academy Admin** (`admin.tarabai@shubham.edu`) scoped exclusively to the **Tarabai Park Campus**.
- **Data Isolation**: Each admin team will view, manage, and receive data (students, batches, attendance, fee collections, exam schedules, teacher allocations, and notifications) solely for their assigned campus.
- **UI & Design**: **Kept strictly as it is**. No color palette changes or redesigns. The classic Shubham Academy look and feel remains identical across both campuses.

---

## 2. Campus & Account Mapping Matrix

| Campus / Department | Role | Email | Password | Name | Assigned Department |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mangalvar Peth** *(Existing)* | **Academy Admin** | `admin@shubham.edu` | `password123` | Rajesh Patil | Mangalvar Peth |
| **Mangalvar Peth** *(Existing)* | **Super Admin** | `superadmin@shubham.edu` | `password123` | Shubham Sharma | Mangalvar Peth |
| **Tarabai Park** *(New Clone)* | **Academy Admin** | `admin.tarabai@shubham.edu` | `password123` | Vikram Desai | Tarabai Park |
| **Tarabai Park** *(New Clone)* | **Super Admin** | `superadmin.tarabai@shubham.edu` | `password123` | Sanjay Shinde | Tarabai Park |

---

## 3. Data Scoping & Campus Boundaries

The codebase already organizes classes and batches by branch:
- **Mangalvar Peth Batches**: Batches matching `mangalvar` or `mangalwar`
- **Tarabai Park Batches**: Batches matching `tarabai`

### 3.1 Campus Batches Roster
```
Mangalvar Peth Batches:
├── 11th pcm Mangalvar peth
├── 11th pcb Mangalvar peth
├── 11th pcmb Mangalvar peth
├── 12th pcm Mangalvar peth
├── 12th pcb Mangalvar peth
└── 12th pcmb Mangalvar peth

Tarabai Park Batches:
├── 11th pcm tarabai park
├── 11th pcb tarabai park
├── 11th pcmb tarabai park
├── 12th pcm tarabai park
├── 12th pcb tarabai park
└── 12th pcmb tarabai park
```

### 3.2 Data Isolation Rules by Module

| Module | Mangalvar Peth Admin Visibility | Tarabai Park Admin Visibility |
| :--- | :--- | :--- |
| **Dashboard KPIs** | Counts, revenue, and attendance calculated exclusively from Mangalvar Peth students & batches. | Counts, revenue, and attendance calculated exclusively from Tarabai Park students & batches. |
| **Student Management** | Only students enrolled in Mangalvar Peth batches. | Only students enrolled in Tarabai Park batches. |
| **Batch Management** | Only Mangalvar Peth batches (6 batches). Batch creation restricted to Mangalvar Peth. | Only Tarabai Park batches (6 batches). Batch creation restricted to Tarabai Park. |
| **Attendance & Reports** | Daily logs, RFID biometrics, and dual-lecture (Lec 1 & 2) attendance for Mangalvar Peth. | Daily logs, RFID biometrics, and dual-lecture (Lec 1 & 2) attendance for Tarabai Park. |
| **Excel Sheet Upload** | Validates and imports records into Mangalvar Peth batches only. | Validates and imports records into Tarabai Park batches only. |
| **Fee Collection & Concessions** | Fee ledger, pending fees, discount approvals, and fee receipts for Mangalvar Peth students. | Fee ledger, pending fees, discount approvals, and fee receipts for Tarabai Park students. |
| **Examinations & Marks** | Test scheduling, invigilator assignments, and marks entry for Mangalvar Peth. | Test scheduling, invigilator assignments, and marks entry for Tarabai Park. |
| **Notifications & WhatsApp** | Parent dispatches (SMS/WhatsApp) and history logs for Mangalvar Peth parents. | Parent dispatches (SMS/WhatsApp) and history logs for Tarabai Park parents. |
| **Books & Study Materials** | Books stock and delivery tracking for Mangalvar Peth students. | Books stock and delivery tracking for Tarabai Park students. |

---

## 4. UI Design Policy: Kept As-Is

Per explicit requirement:
- **No theme shifts or color modifications**: Both campuses retain the exact current colors, styles, CSS tokens, and layout.
- **Sidebar & Header**: Retain their existing design and styling.
- **Login Screen**: Minimal, non-intrusive campus selector buttons added to `SignIn.jsx` purely for convenient testing and 1-click credential auto-fill, styled consistently with the current role buttons.

---

## 5. Technical Implementation Steps

### Step 1: Centralized Branch Scoping Helper (`branchUtils.js`)
Create `frontend/src/utils/branchUtils.js` to normalize and match branch names:
```javascript
export const isItemInBranch = (item, targetBranch) => {
  if (!targetBranch || targetBranch === 'All') return true;
  const t = targetBranch.toLowerCase();
  const isTarabai = t.includes('tarabai');
  const isMangalvar = t.includes('mangalvar') || t.includes('mangalwar');

  const str = JSON.stringify(item || {}).toLowerCase();
  if (isTarabai) return str.includes('tarabai');
  if (isMangalvar) return str.includes('mangalvar') || str.includes('mangalwar');
  return true;
};
```

### Step 2: Authentication & User Branch Assignment
- Update `frontend/src/services/authService.js` to assign `branch: 'Mangalvar Peth'` for `admin@shubham.edu` / `superadmin@shubham.edu`, and `branch: 'Tarabai Park'` for `admin.tarabai@shubham.edu` / `superadmin.tarabai@shubham.edu`.
- Update `frontend/src/pages/auth/SignIn.jsx` to allow logging in directly as:
  - Academy Admin (Mangalvar Peth) -> `admin@shubham.edu` / `password123`
  - Super Admin (Mangalvar Peth) -> `superadmin@shubham.edu` / `password123`
  - Academy Admin (Tarabai Park) -> `admin.tarabai@shubham.edu` / `password123`
  - Super Admin (Tarabai Park) -> `superadmin.tarabai@shubham.edu` / `password123`

### Step 3: Frontend Data Scoping Integration
Apply branch filtering across all admin services and state hooks:
1. **Students & Batches**: Filter lists returned from `studentService` and `batchService` so that only records matching `user.branch` are displayed.
2. **Attendance & RFID**: Scope daily lecture logs and attendance reports to the admin's campus batches.
3. **Fees & Concession Approvals**: Scope fee records, pending fee lists, and discount approval queues to that campus's students.
4. **Examinations & Timetable**: Limit exam scheduler and activity timetable batch options to the logged-in admin's campus.
5. **Dashboard Analytics**: Calculate student totals, fee collection, attendance percentages, and test schedules solely from the branch-scoped data.

### Step 4: Backend User Seeding (`backend/seed_users.py`)
Add the Tarabai Park admin accounts into `backend/seed_users.py` with `branch="Tarabai Park"` and tag existing ones with `branch="Mangalvar Peth"`.

---

## 6. Execution Readiness
Everything is planned with zero disruption to the existing UI. Ready for execution upon confirmation.
