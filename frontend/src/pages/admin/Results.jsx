import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import marksService from '../../services/marksService';
import { Award, Trophy, Medal, Download } from 'lucide-react';
import reportService from '../../services/reportService';
import { toast } from 'react-toastify';

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

        <Button variant="outline" icon={Download} onClick={handleExport}>
          Export Merit List (.PDF)
        </Button>
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
              <span className="small text-sa-muted d-block mb-2">{scorer.rollNumber} • {scorer.examTitle}</span>
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
        <h5 className="brand-font fw-bold text-sa-charcoal mb-3 fs-6">
          Consolidated Scoreboard
        </h5>
        <Table
          columns={[
            { key: 'rollNumber', title: 'Roll No.', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'studentName', title: 'Student Name' },
            { key: 'examTitle', title: 'Examination Title' },
            { key: 'subject', title: 'Subject' },
            { key: 'obtainedMarks', title: 'Marks', render: (val, row) => `${val} / ${row.maxMarks}` },
            { key: 'percentage', title: 'Percentage', render: (val) => <span className="fw-bold">{val}%</span> },
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
