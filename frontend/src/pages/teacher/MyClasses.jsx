import React from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { BookOpen, Users, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyClasses() {
  const navigate = useNavigate();

  const classes = [
    { id: 'CLS-12A', name: '12th Science - Alpha (Morning)', subject: 'Physics (Advanced)', studentsCount: 60, time: 'Mon, Wed, Fri (08:00 AM)', room: 'Lecture Hall 2' },
    { id: 'CLS-11B', name: '11th Science - Beta (Evening)', subject: 'Physics (Foundations)', studentsCount: 65, time: 'Tue, Thu, Sat (03:30 PM)', room: 'Lecture Hall 4' },
    { id: 'CLS-NEET', name: 'NEET Intensive Physics Special', subject: 'Mechanics & Modern Physics', studentsCount: 45, time: 'Sunday (09:00 AM - 01:00 PM)', room: 'Auditorium' },
  ];

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '16px', minWidth: 0, boxSizing: 'border-box' }}>
      <style>{`
        .teacher-class-card {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          box-sizing: border-box;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .teacher-class-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
      `}</style>

      {/* Header */}
      <div className="d-flex flex-column pt-0 pb-0.5">
        <h1 className="brand-font fw-bold m-0" style={{ fontSize: '23px', lineHeight: 1.25, color: '#0F172A' }}>
          My Classes & Timetable
        </h1>
        <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
          Active teaching batches, course syllabus pacing, and classroom schedules
        </p>
      </div>

      <div className="row g-3">
        {classes.map((c, i) => (
          <div key={i} className="col-12 col-md-4">
            <div className="teacher-class-card p-3.5 h-100 d-flex flex-column justify-content-between" style={{ padding: '18px 20px' }}>
              <div>
                <span
                  className="badge mb-2 d-inline-block"
                  style={{
                    backgroundColor: '#FEE2E2',
                    color: '#8B1216',
                    border: '1px solid #FECACA',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}
                >
                  {c.id}
                </span>
                <h2 className="brand-font fw-bold m-0 mb-1" style={{ fontSize: '16px', color: '#0F172A' }}>
                  {c.name}
                </h2>
                <span className="small fw-semibold d-block mb-3" style={{ color: '#D97706', fontSize: '12.5px' }}>
                  {c.subject}
                </span>

                <div className="d-flex flex-column gap-2 small text-secondary">
                  <div className="d-flex align-items-center gap-2">
                    <Users size={15} style={{ color: '#64748B' }} />
                    <span style={{ fontSize: '12.5px', color: '#475569' }}>{c.studentsCount} Students Enrolled</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={15} style={{ color: '#64748B' }} />
                    <span style={{ fontSize: '12.5px', color: '#475569' }}>{c.time}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <MapPin size={15} style={{ color: '#64748B' }} />
                    <span style={{ fontSize: '12.5px', color: '#475569' }}>{c.room}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-top mt-3 d-flex gap-2">
                <Button size="sm" variant="outline" className="w-100" onClick={() => navigate('/teacher/attendance')}>
                  Attendance
                </Button>
                <button
                  type="button"
                  className="btn btn-sm w-100 text-white fw-semibold"
                  style={{ backgroundColor: '#8B1216', borderRadius: '8px', fontSize: '12.5px' }}
                  onClick={() => navigate('/teacher/students')}
                >
                  Students
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
