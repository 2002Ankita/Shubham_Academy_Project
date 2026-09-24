import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import examService from '../../services/examService';
import { useNavigate } from 'react-router-dom';
import { BookCheck, FileSpreadsheet } from 'lucide-react';

export default function TeacherExaminations() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const data = await examService.getAll();
        setExams(data);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Assigned Examinations & Question Papers
          </h3>
          <span className="small text-sa-muted">
            Track examination invigilation, timetable, and enter marks
          </span>
        </div>

        <Button variant="primary" icon={FileSpreadsheet} onClick={() => navigate('/teacher/marks')}>
          Enter Assessment Marks
        </Button>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'title', title: 'Examination', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'standard', title: 'Class' },
            { key: 'subject', title: 'Subject' },
            { key: 'date', title: 'Date' },
            { key: 'startTime', title: 'Timing', render: (val, row) => `${val} (${row.duration})` },
            { key: 'roomNo', title: 'Room' },
            { key: 'maxMarks', title: 'Max Marks' },
            {
              key: 'status',
              title: 'Status',
              render: (val) => (
                <span className={val === 'Scheduled' ? 'badge-pending' : 'badge-active'}>
                  {val}
                </span>
              )
            },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: () => (
                <Button size="sm" variant="outline" onClick={() => navigate('/teacher/marks')}>
                  Enter Marks
                </Button>
              )
            }
          ]}
          data={exams}
          loading={loading}
        />
      </div>
    </div>
  );
}
