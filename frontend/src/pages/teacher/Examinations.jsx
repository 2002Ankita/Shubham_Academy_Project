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
    <div className="d-flex flex-column w-100" style={{ gap: '16px', minWidth: 0, boxSizing: 'border-box' }}>
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 pt-0 pb-0.5">
        <div>
          <h1 className="brand-font fw-bold m-0" style={{ fontSize: '23px', lineHeight: 1.25, color: '#0F172A' }}>
            Assigned Examinations
          </h1>
          <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
            Track examination invigilation, timetable, and enter marks
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/teacher/marks')}
          className="btn d-inline-flex align-items-center gap-1.5 text-white border-0 fw-semibold shadow-xs"
          style={{
            backgroundColor: '#8B1216',
            fontSize: '13px',
            padding: '8px 16px',
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.92)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
        >
          <FileSpreadsheet size={16} />
          <span>Enter Assessment Marks</span>
        </button>
      </div>

      <Table
        columns={[
          { key: 'title', title: 'Examination', render: (val) => <span className="fw-bold text-sa-charcoal">{val}</span> },
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
              <span
                className="badge rounded-pill fw-medium"
                style={
                  val === 'Scheduled'
                    ? { backgroundColor: '#E0F2FE', color: '#0284C7', border: '1px solid #BAE6FD', fontSize: '11px', padding: '3px 8px' }
                    : { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '11px', padding: '3px 8px' }
                }
              >
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
  );
}
