import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import marksService from '../../services/marksService';
import { Award, Trophy, Download } from 'lucide-react';
import reportService from '../../services/reportService';
import { toast } from 'react-toastify';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await marksService.getStudentResults('STU-001');
        setResults(data);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const handleDownload = () => {
    reportService.downloadReport('AARAV_DESHMUKH_REPORT_CARD_TERM1');
    toast.success('Report card downloaded successfully!');
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            My Academic Results & Report Card
          </h3>
          <span className="small text-sa-muted">
            Performance analytics, letter grades, and faculty evaluations
          </span>
        </div>

        <Button variant="outline" icon={Download} onClick={handleDownload}>
          Download Grade Sheet (.PDF)
        </Button>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="sa-card p-4 border-warning border-2">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-sa-muted fw-semibold">PHYSICS EXCELLENCE</span>
              <Trophy size={22} className="text-warning" />
            </div>
            <h3 className="brand-font fw-extrabold text-success m-0 fs-3">94%</h3>
            <span className="small text-sa-muted">Grade A+ • Outstanding performance</span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="sa-card p-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-sa-muted fw-semibold">CHEMISTRY SCORE</span>
              <Award size={22} className="text-sa-primary" />
            </div>
            <h3 className="brand-font fw-extrabold text-success m-0 fs-3">90%</h3>
            <span className="small text-sa-muted">Grade A+ • Strong numerical analysis</span>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="sa-card p-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-sa-muted fw-semibold">CUMULATIVE PERCENTAGE</span>
              <Award size={22} className="text-sa-mustard" />
            </div>
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-3">92.0%</h3>
            <span className="small text-sa-muted">Rank #1 in Section Alpha</span>
          </div>
        </div>
      </div>

      <div className="sa-card p-4">
        <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
          Published Mark Sheets
        </h5>

        <Table
          columns={[
            { key: 'examTitle', title: 'Assessment Name', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'subject', title: 'Subject' },
            { key: 'maxMarks', title: 'Max Marks' },
            {
              key: 'obtainedMarks',
              title: 'Marks Obtained',
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
          data={results}
          loading={loading}
        />
      </div>
    </div>
  );
}
