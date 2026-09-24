import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import examService from '../../services/examService';
import { BookCheck, Calendar, Clock, MapPin } from 'lucide-react';

export default function StudentExaminations() {
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
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Examination Timetable & Hall Schedules
        </h3>
        <span className="small text-sa-muted">
          Upcoming midterm evaluations, hall tickets, and test guidelines
        </span>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'title', title: 'Examination Name', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'subject', title: 'Subject', render: (val) => <span className="badge bg-light text-dark border">{val}</span> },
            { key: 'date', title: 'Date', render: (val) => <span className="fw-semibold text-sa-primary">{val}</span> },
            { key: 'startTime', title: 'Timing', render: (val, row) => `${val} (${row.duration})` },
            { key: 'roomNo', title: 'Examination Hall' },
            { key: 'maxMarks', title: 'Maximum Marks', render: (val) => `${val} Marks` },
            { key: 'passingMarks', title: 'Passing', render: (val) => `${val} Marks` },
            {
              key: 'status',
              title: 'Status',
              render: (val) => (
                <span className={val === 'Scheduled' ? 'badge-pending' : 'badge-active'}>
                  {val}
                </span>
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
