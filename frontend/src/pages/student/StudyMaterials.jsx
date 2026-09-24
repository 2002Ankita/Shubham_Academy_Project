import React from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { BookMarked, Download, FileText } from 'lucide-react';
import { toast } from 'react-toastify';

export default function StudentStudyMaterials() {
  const materials = [
    { id: 'MAT-01', title: 'Physics Wave Optics: Key Formulas & Derivations', subject: 'Physics', author: 'Dr. Priya Kulkarni', fileType: 'PDF Document', size: '3.4 MB', date: '2026-09-15' },
    { id: 'MAT-02', title: 'Mathematics Calculus Practice Problem Bank (100 Qs)', subject: 'Mathematics', author: 'Prof. Amit Sawant', fileType: 'PDF Document', size: '4.8 MB', date: '2026-09-10' },
    { id: 'MAT-03', title: 'Organic Chemistry Reactions Summary Sheet', subject: 'Chemistry', author: 'Mrs. Neha Deshpande', fileType: 'PDF Document', size: '2.8 MB', date: '2026-09-08' },
    { id: 'MAT-04', title: 'Electrostatics DPP & Previous Year Questions', subject: 'Physics', author: 'Dr. Priya Kulkarni', fileType: 'PDF Document', size: '5.1 MB', date: '2026-08-28' },
  ];

  const handleDownload = (title) => {
    toast.info(`Downloading "${title}"...`);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Course Study Materials & Notes
        </h3>
        <span className="small text-sa-muted">
          Download faculty-curated lecture slides, formula summaries, and revision guides
        </span>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            {
              key: 'title',
              title: 'Resource Title',
              render: (val) => (
                <div className="d-flex align-items-center gap-2">
                  <FileText size={18} className="text-sa-primary" />
                  <span className="fw-semibold text-sa-charcoal">{val}</span>
                </div>
              )
            },
            { key: 'subject', title: 'Subject', render: (val) => <span className="badge bg-light text-dark border">{val}</span> },
            { key: 'author', title: 'Faculty' },
            { key: 'fileType', title: 'Type' },
            { key: 'size', title: 'Size' },
            { key: 'date', title: 'Uploaded' },
            {
              key: 'title',
              title: 'Action',
              align: 'end',
              render: (val) => (
                <Button
                  size="sm"
                  variant="outline"
                  icon={Download}
                  onClick={() => handleDownload(val)}
                >
                  Download
                </Button>
              )
            }
          ]}
          data={materials}
        />
      </div>
    </div>
  );
}
