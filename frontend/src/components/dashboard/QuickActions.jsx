import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  CreditCard,
  ScanLine,
  FilePlus,
  BookOpen,
  Bell
} from 'lucide-react';

export default function QuickActions({ role = 'admin', onTriggerAction }) {
  const navigate = useNavigate();

  const getActions = () => {
    if (role === 'admin') {
      return [
        { label: 'Register Student', icon: UserPlus, path: '/admin/students/register', color: '#A91F1F' },
        { label: 'RFID Attendance', icon: ScanLine, path: '/admin/attendance', color: '#D5A61C' },
        { label: 'Collect Fee', icon: CreditCard, path: '/admin/fees', color: '#168554' },
        { label: 'Create Exam', icon: FilePlus, path: '/admin/exams', color: '#D97718' },
      ];
    }
    if (role === 'teacher') {
      return [
        { label: 'Mark Attendance', icon: ScanLine, path: '/teacher/attendance', color: '#A91F1F' },
        { label: 'Enter Exam Marks', icon: FilePlus, path: '/teacher/marks', color: '#D5A61C' },
        { label: 'Upload Materials', icon: BookOpen, path: '/teacher/study-materials', color: '#168554' },
        { label: 'Post Notice', icon: Bell, path: '/teacher/announcements', color: '#D97718' },
      ];
    }
    // student
    return [
      { label: 'View Timetable', icon: BookOpen, path: '/student/classes', color: '#A91F1F' },
      { label: 'Attendance Card', icon: ScanLine, path: '/student/attendance', color: '#D5A61C' },
      { label: 'Pay / View Fees', icon: CreditCard, path: '/student/fees', color: '#168554' },
      { label: 'My Report Card', icon: FilePlus, path: '/student/results', color: '#D97718' },
    ];
  };

  const actions = getActions();

  return (
    <div className="sa-card p-4">
      <h6 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">Quick Navigation & Shortcuts</h6>
      <div className="row g-2">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <div key={i} className="col-6 col-sm-3">
              <button
                type="button"
                className="btn btn-light w-100 p-3 rounded-3 text-start border d-flex flex-column align-items-center justify-content-center text-center gap-2 hover-shadow"
                style={{ backgroundColor: '#faf9f6', transition: 'var(--sa-transition)' }}
                onClick={() => navigate(act.path)}
              >
                <div
                  className="rounded-circle p-2 text-white d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: act.color }}
                >
                  <Icon size={18} />
                </div>
                <span className="small fw-semibold text-sa-charcoal lh-sm">{act.label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
