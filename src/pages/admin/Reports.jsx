import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import reportService from '../../services/reportService';
import { FileText, Download, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newReport, setNewReport] = useState({ name: '', type: 'Attendance', fileFormat: 'PDF' });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.getAll();
      setReports(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    await reportService.generateReport(newReport);
    toast.success('Report generated successfully!');
    setModalOpen(false);
    setNewReport({ name: '', type: 'Attendance', fileFormat: 'PDF' });
    fetchReports();
  };

  const handleDownload = (id) => {
    reportService.downloadReport(id);
    toast.info('Downloading official report document...');
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Official Academy Reports
          </h3>
          <span className="small text-sa-muted">
            Download audit ledgers, attendance summaries, and fee collection registers
          </span>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
          Generate New Custom Report
        </Button>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'id', title: 'Ref No.', render: (val) => <span className="fw-bold">{val}</span> },
            {
              key: 'name',
              title: 'Report Title',
              render: (val) => (
                <span className="fw-semibold text-sa-charcoal d-flex align-items-center gap-2">
                  <FileText size={16} className="text-sa-primary" />
                  {val}
                </span>
              )
            },
            {
              key: 'type',
              title: 'Type',
              render: (val) => <span className="badge bg-light text-dark border">{val}</span>
            },
            { key: 'fileFormat', title: 'Format' },
            { key: 'size', title: 'Size' },
            { key: 'generatedDate', title: 'Date' },
            { key: 'generatedBy', title: 'Issued By' },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val) => (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={() => handleDownload(val)}
                >
                  <Download size={14} /> Download
                </button>
              )
            }
          ]}
          data={reports}
          loading={loading}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Generate Custom Academy Report">
        <form onSubmit={handleGenerate}>
          <Input
            label="Report Title / Name"
            name="name"
            value={newReport.name}
            onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
            placeholder="e.g. Term 1 Class-Wise Attendance Analysis"
            required
          />
          <div className="row g-2">
            <div className="col-6">
              <Select
                label="Domain / Category"
                name="type"
                value={newReport.type}
                onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
                options={['Attendance', 'Financial', 'Academic', 'Security', 'General']}
              />
            </div>
            <div className="col-6">
              <Select
                label="File Format"
                name="fileFormat"
                value={newReport.fileFormat}
                onChange={(e) => setNewReport({ ...newReport, fileFormat: e.target.value })}
                options={['PDF', 'Excel / CSV', 'JSON']}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Generate & Archive</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
