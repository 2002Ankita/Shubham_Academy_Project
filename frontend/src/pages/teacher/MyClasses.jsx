import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import BackButton from '../../components/common/BackButton';
import { BookOpen, Users, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import batchService from '../../services/batchService';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';

export default function MyClasses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const data = await batchService.getBatches();
        
        let filteredData = data;
        if (user && user.role === 'teacher') {
          filteredData = data.filter(b => 
            b.teacher_name && 
            b.teacher_name.toLowerCase().replace(/\s+/g, '') === user.name.toLowerCase().replace(/\s+/g, '')
          );
        }
        
        setClasses(filteredData);
      } catch (err) {
        console.error("Failed to load classes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [user]);



  return (
    <div className="d-flex flex-column w-100" style={{ gap: '16px', minWidth: 0, boxSizing: 'border-box' }}>
      <BackButton to="/teacher/dashboard" label="Back to Dashboard" />
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
        {loading ? (
          <div className="text-center p-4">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="text-center p-4 text-sa-muted">No classes assigned yet.</div>
        ) : classes.map((c, i) => (
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
                  {c.batch_id || `CLS-${i+1}`}
                </span>
                <h2 className="brand-font fw-bold m-0 mb-1" style={{ fontSize: '16px', color: '#0F172A' }}>
                  {c.name}
                </h2>
                <span className="small fw-semibold d-block mb-3" style={{ color: '#D97706', fontSize: '12.5px' }}>
                  {c.subject || 'All Subjects'}
                </span>

                <div className="d-flex flex-column gap-2 small text-secondary">
                  <div className="d-flex align-items-center gap-2">
                    <Users size={15} style={{ color: '#64748B' }} />
                    <span style={{ fontSize: '12.5px', color: '#475569' }}>{c.studentsCount || 0} Students Enrolled</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={15} style={{ color: '#64748B' }} />
                    <span style={{ fontSize: '12.5px', color: '#475569' }}>{c.schedule || c.time || 'Schedule TBD'}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <MapPin size={15} style={{ color: '#64748B' }} />
                    <span style={{ fontSize: '12.5px', color: '#475569' }}>{c.room || 'Room TBD'}</span>
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
