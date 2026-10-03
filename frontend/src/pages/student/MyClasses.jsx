import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import { BookOpen, UserCheck, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import studentService from '../../services/studentService';
import batchService from '../../services/batchService';
import { toast } from 'react-toastify';

export default function StudentClasses() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        if (user && user.id) {
          const studentRes = await studentService.getById(user.id);
          setStudentInfo(studentRes);

          const batchesRes = await batchService.getBatches();
          
          // Filter batches assigned to the student's batch name
          const myBatches = batchesRes.filter(b => 
            b.name && studentRes.batch &&
            b.name.toLowerCase().replace(/\s+/g, '') === studentRes.batch.toLowerCase().replace(/\s+/g, '')
          );

          // Build timetable format
          const formatted = myBatches.map(b => {
            // Extract day and time if it matches something like "Mon( 8:00 to 10:00)"
            let day = 'Scheduled';
            let time = b.time || 'TBD';
            if (b.time && b.time.includes('(')) {
              const parts = b.time.split('(');
              day = parts[0].trim();
              time = parts[1].replace(')', '').trim();
            }

            return {
              day: day,
              time: time,
              subject: b.subject,
              teacher: b.teacher_name || 'TBD',
              room: b.room || 'TBD'
            };
          });
          
          setTimetable(formatted);
        }
      } catch (err) {
        console.error("Failed to load classes", err);
        toast.error('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [user]);

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          My Weekly Class Schedule & Timetable
        </h3>
        <span className="small text-sa-muted">
          {studentInfo ? `${studentInfo.standard} (${studentInfo.batch}) • ${studentInfo.branch}` : 'Loading...'}
        </span>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'day', title: 'Day', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'time', title: 'Session Timing', render: (val) => <span className="fw-semibold text-sa-primary">{val}</span> },
            { key: 'subject', title: 'Subject & Topic' },
            { key: 'teacher', title: 'Faculty' },
            { key: 'room', title: 'Classroom / Lab', render: (val) => <span className="badge bg-light text-dark border">{val}</span> }
          ]}
          data={timetable}
          loading={loading}
        />
      </div>
    </div>
  );
}
