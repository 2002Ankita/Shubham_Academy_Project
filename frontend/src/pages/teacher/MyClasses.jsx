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
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          My Allocated Classes & Timetable
        </h3>
        <span className="small text-sa-muted">
          Active teaching batches, course syllabus pacing, and classroom schedules
        </span>
      </div>

      <div className="row g-3">
        {classes.map((c, i) => (
          <div key={i} className="col-12 col-md-4">
            <div className="sa-card p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <span className="badge bg-sa-primary text-white mb-2">{c.id}</span>
                <h5 className="brand-font fw-bold text-sa-charcoal mb-1 fs-6">{c.name}</h5>
                <span className="small fw-semibold text-sa-mustard d-block mb-3">{c.subject}</span>

                <div className="d-flex flex-column gap-2 small text-sa-muted">
                  <div className="d-flex align-items-center gap-2">
                    <Users size={15} /> <span>{c.studentsCount} Students Enrolled</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={15} /> <span>{c.time}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <MapPin size={15} /> <span>{c.room}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-top mt-3 d-flex gap-2">
                <Button size="sm" variant="outline" className="w-100" onClick={() => navigate('/teacher/attendance')}>
                  Attendance
                </Button>
                <Button size="sm" variant="primary" className="w-100" onClick={() => navigate('/teacher/students')}>
                  Students
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
