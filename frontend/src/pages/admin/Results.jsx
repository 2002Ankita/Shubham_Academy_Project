import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import marksService from '../../services/marksService';
import { Award, Trophy, Medal, Download, FileSpreadsheet, FileText, Calendar, UserCheck } from 'lucide-react';
import reportService from '../../services/reportService';
import { toast } from 'react-toastify';
import {
  exportResultToExcel,
  exportResultToWord,
  exportAllResultsToExcel,
  exportAllResultsToWord
} from '../../utils/resultExport';

export default function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await marksService.getAll();
        setResults(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExport = () => {
    reportService.downloadReport('EXAM_RESULTS_MERIT_LIST_2026');
    toast.success('Merit list downloaded successfully!');
  };

  const handleDownloadExcel = (row) => {
    try {
      exportResultToExcel(row, { full_name: row.studentName, rollNumber: row.rollNumber });
      toast.success(`Result for ${row.studentName} exported to Excel!`);
    } catch {
      toast.error('Failed to export to Excel');
    }
  };

  const handleDownloadWord = (row) => {
    try {
      exportResultToWord(row, { full_name: row.studentName, rollNumber: row.rollNumber });
      toast.success(`Result for ${row.studentName} exported to Word (.doc)!`);
    } catch {
      toast.error('Failed to export to Word');
    }
  };

  const handleExportAllExcel = () => {
    if (!results || results.length === 0) {
      toast.warning('No results to export');
      return;
    }
    exportAllResultsToExcel(results, { full_name: 'Academy Wide', rollNumber: 'ALL' });
    toast.success('All records exported to Excel!');
  };

  const handleExportAllWord = () => {
    if (!results || results.length === 0) {
      toast.warning('No results to export');
      return;
    }
    exportAllResultsToWord(results, { full_name: 'Academy Wide', rollNumber: 'ALL' });
    toast.success('All records exported to Word!');
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Results & Merit Rankings
          </h3>
          <span className="small text-sa-muted">
            Batch-wise merit rankings, top percentiles, and academic report sheets
          </span>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <Button variant="outline" icon={Download} onClick={handleExport}>
            Export Merit List (.PDF)
          </Button>
        </div>
      </div>

      {/* Top Scorers Cards */}
      <div className="row g-3">
        {[...results].sort((a, b) => b.percentage - a.percentage).slice(0, 3).map((scorer, index) => (
          <div key={index} className="col-12 col-md-4">
            <div className={`sa-card p-4 position-relative ${index === 0 ? 'border-warning border-2' : index === 1 ? 'border-primary border-2' : ''}`}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className={`badge ${index === 0 ? 'bg-warning text-dark' : index === 1 ? 'bg-sa-primary text-white' : 'bg-secondary text-white'} fw-bold`}>
                  Rank #{index + 1} ({scorer.subject})
                </span>
                {index === 0 ? <Trophy size={24} className="text-warning" /> : <Medal size={24} className={index === 1 ? 'text-sa-primary' : 'text-secondary'} />}
              </div>
              <h4 className="brand-font fw-extrabold text-sa-charcoal m-0">{scorer.studentName}</h4>
              <span className="small text-sa-muted d-block mb-2">{scorer.rollNumber} • {scorer.examName || scorer.examTitle}</span>
              <div className="fw-extrabold text-success fs-5">{scorer.percentage}% ({scorer.obtainedMarks}/{scorer.maxMarks})</div>
            </div>
          </div>
        ))}
        {results.length === 0 && !loading && (
          <div className="col-12">
            <div className="alert alert-light border text-center text-muted m-0">
              No results available yet to determine rankings.
            </div>
          </div>
        )}
      </div>

      <div className="sa-card p-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3 pb-2 border-bottom">
          <div>
            <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
              Consolidated Scoreboard
            </h5>
            <span className="small text-sa-muted">
              Complete student examination performance with instant Excel & Word download
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 fw-semibold"
              onClick={handleExportAllExcel}
            >
              <FileSpreadsheet size={15} />
              <span>Export All (Excel)</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 fw-semibold"
              onClick={handleExportAllWord}
            >
              <FileText size={15} />
              <span>Export All (Word)</span>
            </button>
          </div>
        </div>

        <Table
          columns={[
            { key: 'rollNumber', title: 'Roll No.', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'studentName', title: 'Student Name' },
            { key: 'examName', title: 'Exam Name', render: (val, row) => <span className="fw-semibold">{val || row.examTitle}</span> },
            {
              key: 'date',
              title: 'Date',
              render: (val) => (
                <div className="d-inline-flex align-items-center gap-1 small text-muted">
                  <Calendar size={13} />
                  <span>{val || 'N/A'}</span>
                </div>
              )
            },
            { key: 'subject', title: 'Subject' },
            {
              key: 'teacher',
              title: 'Teacher',
              render: (val) => (
                <div className="d-inline-flex align-items-center gap-1 small text-dark">
                  <UserCheck size={13} className="text-success" />
                  <span>{val || 'Faculty'}</span>
                </div>
              )
            },
            { key: 'obtainedMarks', title: 'Marks', render: (val, row) => `${val} / ${row.maxMarks}` },
            { key: 'percentage', title: 'Percentage', render: (val) => <span className="fw-bold">{val}%</span> },
            {
              key: 'grade',
              title: 'Grade',
              render: (val) => <span className="badge bg-success small">{val}</span>
            },
            {
              key: 'actions',
              title: 'Download Result',
              align: 'center',
              render: (_, row) => (
                <div className="d-inline-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 py-1 px-2 fw-semibold"
                    title="Download Result in Excel"
                    onClick={() => handleDownloadExcel(row)}
                  >
                    <FileSpreadsheet size={14} className="text-success" />
                    <span>Excel</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-1 px-2 fw-semibold"
                    title="Download Result in Word"
                    onClick={() => handleDownloadWord(row)}
                  >
                    <FileText size={14} className="text-primary" />
                    <span>Word</span>
                  </button>
                </div>
              )
            }
          ]}
          data={results}
          loading={loading}
        />
      </div>
    </div>
  );
}
