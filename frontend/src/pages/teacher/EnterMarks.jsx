import React, { useState, useEffect } from 'react';
import MarksForm from '../../components/forms/MarksForm';
import Table from '../../components/common/Table';
import marksService from '../../services/marksService';
import studentService from '../../services/studentService';
import examService from '../../services/examService';
import { toast } from 'react-toastify';

export default function EnterMarks() {
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mList, sList, eList] = await Promise.all([
        marksService.getAll(),
        studentService.getAll(),
        examService.getAll()
      ]);
      setMarks(mList);
      setStudents(sList);
      setExams(eList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarksSubmit = async (formData) => {
    await marksService.submitMarks(formData);
    toast.success(`Marks published for ${formData.studentName}!`);
    fetchData();
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '16px', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="d-flex flex-column pt-0 pb-0.5">
        <h1 className="brand-font fw-bold m-0" style={{ fontSize: '23px', lineHeight: 1.25, color: '#0F172A' }}>
          Faculty Marks Entry Portal
        </h1>
        <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
          Record student theory and practical marks with feedback
        </p>
      </div>

      <MarksForm
        students={students}
        exams={exams}
        onSubmit={handleMarksSubmit}
      />

      <div className="d-flex flex-column gap-2 mt-2">
        <h2 className="brand-font fw-bold m-0 fs-6" style={{ color: '#0F172A' }}>
          Recent Marks Evaluations
        </h2>

        <Table
          columns={[
            { key: 'studentName', title: 'Student', render: (val) => <span className="fw-semibold text-sa-charcoal">{val}</span> },
            { key: 'rollNumber', title: 'Roll No.' },
            { key: 'examTitle', title: 'Exam' },
            { key: 'subject', title: 'Subject' },
            {
              key: 'obtainedMarks',
              title: 'Score',
              render: (val, row) => <span className="fw-bold" style={{ color: '#8B1216' }}>{val} / {row.maxMarks}</span>
            },
            { key: 'percentage', title: '%', render: (val) => `${val}%` },
            {
              key: 'grade',
              title: 'Grade',
              render: (val) => (
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0.5 rounded-2 fw-medium">
                  {val}
                </span>
              )
            },
            { key: 'remarks', title: 'Faculty Remark' }
          ]}
          data={marks}
          loading={loading}
        />
      </div>
    </div>
  );
}
