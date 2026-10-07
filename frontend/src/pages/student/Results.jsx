import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import marksService from '../../services/marksService';
import { Calendar, UserCheck, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { exportExamFullMarkSheet } from '../../utils/resultExport';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const studentId = user?.id || user?._id || 'std-101';
        const data = await marksService.getStudentResults(studentId);
        setResults(data);
      } catch (err) {
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [user]);

  // Download teacher's uploaded full mark sheet list for the exam
  const handleDownloadFullList = (row) => {
    try {
      exportExamFullMarkSheet(row, user);
      const formatLabel = row.fileType === 'word' ? 'Word (.doc)' : 'Excel (.xls)';
      toast.success(
        `Full Mark Sheet for "${row.examName || row.examTitle}" downloaded in ${formatLabel}! Please search your name in the list.`
      );
    } catch (err) {
      toast.error('Failed to download exam mark sheet');
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header Banner */}
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Published Mark Sheets
        </h3>
        <span className="small text-sa-muted">
          Teacher-published exam mark sheets. Download the full list and find your name to verify your marks.
        </span>
      </div>

      {/* Published Mark Sheets Section */}
      <div className="sa-card p-4">
        {/* Clean Table: Exam Name, Date, Subject, Teacher, Total Marks, and Single Download Button */}
        <Table
          columns={[
            {
              key: 'examName',
              title: 'Exam Name',
              render: (val, row) => (
                <span className="fw-bold text-sa-charcoal">
                  {val || row.examTitle}
                </span>
              )
            },
            {
              key: 'date',
              title: 'Date',
              render: (val) => (
                <div className="d-inline-flex align-items-center gap-1 px-2 py-1 bg-light border rounded small text-dark fw-medium">
                  <Calendar size={13} className="text-secondary" />
                  <span>{val || 'N/A'}</span>
                </div>
              )
            },
            {
              key: 'subject',
              title: 'Subject',
              render: (val) => (
                <span className="fw-semibold text-sa-charcoal">
                  {val || 'N/A'}
                </span>
              )
            },
            {
              key: 'teacher',
              title: 'Teacher',
              render: (val) => (
                <div className="d-flex align-items-center gap-1">
                  <UserCheck size={14} className="text-success flex-shrink-0" />
                  <span className="fw-medium text-sa-charcoal small">{val || 'Faculty'}</span>
                </div>
              )
            },
            {
              key: 'maxMarks',
              title: 'Total Marks',
              render: (val) => (
                <span className="fw-bold text-sa-charcoal">
                  {val || 100} Marks
                </span>
              )
            },
            {
              key: 'downloadAction',
              title: 'Download',
              align: 'center',
              render: (_, row) => (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 shadow-xs fw-semibold"
                  onClick={() => handleDownloadFullList(row)}
                  title={`Download mark sheet for ${row.examName || row.examTitle}`}
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              )
            }
          ]}
          data={results}
          loading={loading}
          emptyMessage="No published mark sheets available yet."
        />
      </div>
    </div>
  );
}
