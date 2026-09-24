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
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Faculty Marks Entry Portal
        </h3>
        <span className="small text-sa-muted">
          Record student theory and practical marks with feedback
        </span>
      </div>

      <MarksForm
        students={students}
        exams={exams}
        onSubmit={handleMarksSubmit}
      />

      <div className="sa-card p-4">
        <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
          Recent Marks Evaluations
        </h5>

        <Table
          columns={[
            { key: 'studentName', title: 'Student', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'rollNumber', title: 'Roll No.' },
            { key: 'examTitle', title: 'Exam' },
            { key: 'subject', title: 'Subject' },
            {
              key: 'obtainedMarks',
              title: 'Score',
              render: (val, row) => <span className="fw-bold text-sa-primary">{val} / {row.maxMarks}</span>
            },
            { key: 'percentage', title: '%', render: (val) => `${val}%` },
            {
              key: 'grade',
              title: 'Grade',
              render: (val) => <span className="badge bg-success small">{val}</span>
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
