import React, { useState, useEffect, useMemo } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import marksService from '../../services/marksService';
import { Award, Trophy, Medal, Download, FileSpreadsheet, FileText, Calendar, UserCheck, Building2 } from 'lucide-react';
import reportService from '../../services/reportService';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { getUserBranch, filterMarksByBranch, CAMPUS } from '../../utils/branchUtils';
import {
  exportResultToExcel,
  exportResultToWord,
  exportAllResultsToExcel,
  exportAllResultsToWord
} from '../../utils/resultExport';

export default function Results() {
  const { user } = useAuth();
  const userBranch = getUserBranch(user);
  const isSuperAdmin = (user?.role || '').toLowerCase().includes('super');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(isSuperAdmin ? 'All' : (userBranch || CAMPUS.MANGALVAR_PETH));

  // Regular admin is strictly auto-scoped to their login campus
  const effectiveBranch = isSuperAdmin ? selectedBranch : (userBranch || CAMPUS.MANGALVAR_PETH);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await marksService.getAll();
        setResults(data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filtered by branch
  const filteredResults = useMemo(() => {
    return filterMarksByBranch(results, effectiveBranch);
  }, [results, effectiveBranch]);

  // Counts for campus switcher
  const totalCount = results.length;
  const manglavarCount = useMemo(() => filterMarksByBranch(results, 'Manglavar Peth').length, [results]);
  const tarabaiCount = useMemo(() => filterMarksByBranch(results, 'Tarabai Park').length, [results]);

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
    if (!filteredResults || filteredResults.length === 0) {
      toast.warning('No results to export');
      return;
    }
    const branchLabel = effectiveBranch === 'All' ? 'Academy Wide' : effectiveBranch;
    exportAllResultsToExcel(filteredResults, { full_name: `${branchLabel} Results`, rollNumber: effectiveBranch });
    toast.success(`All ${branchLabel} records exported to Excel!`);
  };

  const handleExportAllWord = () => {
    if (!filteredResults || filteredResults.length === 0) {
      toast.warning('No results to export');
      return;
    }
    const branchLabel = effectiveBranch === 'All' ? 'Academy Wide' : effectiveBranch;
    exportAllResultsToWord(filteredResults, { full_name: `${branchLabel} Results`, rollNumber: effectiveBranch });
    toast.success(`All ${branchLabel} records exported to Word!`);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Results & Merit Rankings
          </h3>
          <span className="small text-sa-muted">
            Batch-wise merit rankings, top percentiles, and academic report sheets by branch
          </span>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Branch badge for regular admin */}
          {!isSuperAdmin && (
            <div
              className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill shadow-xs"
              style={{
                backgroundColor: effectiveBranch.toLowerCase().includes('mangal') ? '#FDF0F0' : '#EFF6FF',
                border: effectiveBranch.toLowerCase().includes('mangal') ? '1px solid #FECACA' : '1px solid #BFDBFE',
                color: effectiveBranch.toLowerCase().includes('mangal') ? '#8B1216' : '#1D4ED8',
                fontSize: '12.5px',
                fontWeight: 600
              }}
            >
              <Building2 size={14} />
              <span>{effectiveBranch}</span>
            </div>
          )}

          {/* Unified Branch Filter Dropdown - Only shown to SuperAdmin */}
          {isSuperAdmin && (
            <div className="position-relative d-inline-flex align-items-center" style={{ minWidth: '220px' }}>
              <Building2
                size={15}
                className="position-absolute"
                style={{
                  left: '12px',
                  pointerEvents: 'none',
                  color: selectedBranch === 'All' ? '#64748B' : (selectedBranch.toLowerCase().includes('mangal') ? '#8B1216' : '#1D4ED8')
                }}
              />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="form-select fw-semibold"
                style={{
                  paddingLeft: '36px',
                  paddingRight: '32px',
                  height: '40px',
                  borderRadius: '10px',
                  borderColor: '#D8DEE4',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '13px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
                  cursor: 'pointer'
                }}
                aria-label="Filter by Branch Campus"
              >
                <option value="All">All Branches ({totalCount} Results)</option>
                <option value="Manglavar Peth">Manglavar Peth ({manglavarCount} Results)</option>
                <option value="Tarabai Park">Tarabai Park ({tarabaiCount} Results)</option>
              </select>
            </div>
          )}

          <Button variant="outline" icon={Download} onClick={handleExport}>
            Export Merit List (.PDF)
          </Button>
        </div>
      </div>

      {/* Top Scorers Cards */}
      <div className="row g-3">
        {[...filteredResults].sort((a, b) => b.percentage - a.percentage).slice(0, 3).map((scorer, index) => {
          const br = scorer.branch || (scorer.rollNumber?.startsWith('TP') ? 'Tarabai Park' : 'Manglavar Peth');
          const isTarabai = br.toLowerCase().includes('tarabai');
          return (
            <div key={index} className="col-12 col-md-4">
              <div className={`sa-card p-4 position-relative ${index === 0 ? 'border-warning border-2' : index === 1 ? 'border-primary border-2' : ''}`}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className={`badge ${index === 0 ? 'bg-warning text-dark' : index === 1 ? 'bg-sa-primary text-white' : 'bg-secondary text-white'} fw-bold`}>
                    Rank #{index + 1} ({scorer.subject})
                  </span>
                  {index === 0 ? <Trophy size={24} className="text-warning" /> : <Medal size={24} className={index === 1 ? 'text-sa-primary' : 'text-secondary'} />}
                </div>
                <h4 className="brand-font fw-extrabold text-sa-charcoal m-0">{scorer.studentName}</h4>
                <div className="d-flex align-items-center gap-1.5 my-1 flex-wrap">
                  <span
                    className="badge rounded-pill fw-semibold"
                    style={{
                      backgroundColor: isTarabai ? '#EFF6FF' : '#FEF2F2',
                      color: isTarabai ? '#1D4ED8' : '#8B1216',
                      border: `1px solid ${isTarabai ? '#BFDBFE' : '#FECACA'}`,
                      fontSize: '10.5px',
                      padding: '2px 7px'
                    }}
                  >
                    {br}
                  </span>
                  <span className="small text-sa-muted">
                    {scorer.batch || scorer.standard || 'General'}
                  </span>
                </div>
                <span className="small text-sa-muted d-block mb-2">{scorer.rollNumber} • {scorer.examName || scorer.examTitle}</span>
                <div className="fw-extrabold text-success fs-5">{scorer.percentage}% ({scorer.obtainedMarks}/{scorer.maxMarks})</div>
              </div>
            </div>
          );
        })}
        {filteredResults.length === 0 && !loading && (
          <div className="col-12">
            <div className="alert alert-light border text-center text-muted m-0">
              No results available for {selectedBranch === 'All' ? 'any branch' : selectedBranch} yet.
            </div>
          </div>
        )}
      </div>

      <div className="sa-card p-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3 pb-2 border-bottom">
          <div>
            <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
              Consolidated Scoreboard
              {selectedBranch !== 'All' && (
                <span className="text-sa-muted fw-normal ms-2" style={{ fontSize: '13px' }}>
                  ({selectedBranch})
                </span>
              )}
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
            {
              key: 'branch',
              title: 'Branch',
              render: (val, row) => {
                const br = val || row.branch || (row.rollNumber?.startsWith('TP') ? 'Tarabai Park' : 'Manglavar Peth');
                const isTarabai = br.toLowerCase().includes('tarabai');
                return (
                  <span
                    className="badge rounded-pill fw-semibold"
                    style={{
                      backgroundColor: isTarabai ? '#EFF6FF' : '#FEF2F2',
                      color: isTarabai ? '#1D4ED8' : '#8B1216',
                      border: `1px solid ${isTarabai ? '#BFDBFE' : '#FECACA'}`,
                      fontSize: '11px',
                      padding: '3px 8px'
                    }}
                  >
                    {br}
                  </span>
                );
              }
            },
            {
              key: 'batch',
              title: 'Batch / Class',
              render: (val, row) => <span className="text-sa-charcoal">{val || row.standard || 'General'}</span>
            },
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
          data={filteredResults}
          loading={loading}
        />
      </div>
    </div>
  );
}
