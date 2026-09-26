import React, { useState, useEffect } from 'react';
import ExamForm from '../../components/forms/ExamForm';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import examService from '../../services/examService';
import teacherService from '../../services/teacherService';
import { Calendar, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function CreateExam() {
  const [exams, setExams] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eList, tList] = await Promise.all([
        examService.getAll(),
        teacherService.getAll()
      ]);
      setExams(eList);
      setTeachers(tList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (formData) => {
    await examService.create(formData);
    toast.success('Examination scheduled successfully!');
    setShowCreateForm(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    await examService.delete(id);
    toast.success('Exam schedule cancelled');
    fetchData();
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Examination Management & Schedules
          </h3>
          <span className="small text-sa-muted">
            Create assessment timetables, hall allocations, and maximum marks definitions
          </span>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Close Form' : '+ Schedule New Exam'}
        </Button>
      </div>

      {showCreateForm && (
        <ExamForm
          teachers={teachers}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="sa-card p-4">
        <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
          Scheduled & Completed Examinations
        </h5>

        <Table
          columns={[
            { key: 'title', title: 'Assessment Name', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'standard', title: 'Target Class' },
            { key: 'subject', title: 'Subject', render: (val) => <span className="badge bg-light text-dark border">{val}</span> },
            { key: 'date', title: 'Date' },
            { key: 'startTime', title: 'Timing', render: (val, row) => `${val} (${row.duration})` },
            { key: 'roomNo', title: 'Hall' },
            { key: 'maxMarks', title: 'Max Marks', render: (val) => `${val} Marks` },
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
              render: (val) => (
                <button
                  type="button"
                  className="btn btn-sm btn-light border p-1 text-danger"
                  onClick={() => handleDelete(val)}
                  title="Delete Exam"
                >
                  <Trash2 size={15} />
                </button>
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
