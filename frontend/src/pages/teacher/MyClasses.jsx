import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
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
        
        // Filter by the logged-in teacher's name if user role is teacher
        let filteredData = data;
        if (user && user.role === 'teacher') {
          filteredData = data.filter(b => 
            b.teacher_name && 
            b.teacher_name.toLowerCase().replace(/\s+/g, '') === user.name.toLowerCase().replace(/\s+/g, '')
          );
        }
        
        setClasses(filteredData);
      } catch (err) {
        toast.error('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

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
        {loading ? (
          <div className="text-center p-4">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="text-center p-4 text-sa-muted">No classes assigned yet.</div>
        ) : classes.map((c, i) => (
          <div key={i} className="col-12 col-md-4">
            <div className="sa-card p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <span className="badge bg-sa-primary text-white mb-2">BATCH</span>
                <h5 className="brand-font fw-bold text-sa-charcoal mb-1 fs-6">{c.name}</h5>
                <span className="small fw-semibold text-sa-mustard d-block mb-3">{c.subject}</span>

                <div className="d-flex flex-column gap-2 small text-sa-muted">
                  <div className="d-flex align-items-center gap-2">
                    <Users size={15} /> <span>{c.student_count || 0} Students Enrolled</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={15} /> <span>{c.time || 'TBD'}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <MapPin size={15} /> <span>{c.room || 'TBD'}</span>
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
