import React, { useState } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { BookMarked, Plus, Download, FileText } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TeacherStudyMaterials() {
  const [materials, setMaterials] = useState([
    { id: 'MAT-01', title: 'Wave Optics: Formulas & Derivations', standard: '12th Science', subject: 'Physics', fileType: 'PDF Document', size: '3.4 MB', uploadDate: '2026-09-15' },
    { id: 'MAT-02', title: 'Rotational Dynamics Problem Bank (100 Qs)', standard: '11th Science', subject: 'Physics', fileType: 'PDF Document', size: '4.8 MB', uploadDate: '2026-09-10' },
    { id: 'MAT-03', title: 'NEET 2026 Physics High-Yield Revision Sheet', standard: 'NEET Special', subject: 'Physics', fileType: 'Handwritten Notes', size: '2.2 MB', uploadDate: '2026-09-05' },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newMat, setNewMat] = useState({ title: '', standard: '12th Science', subject: 'Physics', fileType: 'PDF Document', size: '2.5 MB' });

  const handleUpload = (e) => {
    e.preventDefault();
    const item = {
      ...newMat,
      id: `MAT-0${materials.length + 1}`,
      uploadDate: new Date().toISOString().split('T')[0]
    };
    setMaterials([item, ...materials]);
    toast.success('Study notes uploaded to student portal!');
    setModalOpen(false);
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Study Materials & Lecture Notes
          </h3>
          <span className="small text-sa-muted">
            Share chapter summaries, practice problems, and laboratory guides
          </span>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
          Upload New Material
        </Button>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'id', title: 'Ref No.', render: (val) => <span className="fw-bold">{val}</span> },
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
            { key: 'standard', title: 'Target Class' },
            { key: 'subject', title: 'Subject' },
            { key: 'fileType', title: 'Type' },
            { key: 'size', title: 'Size' },
            { key: 'uploadDate', title: 'Uploaded On' },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: () => (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={() => toast.info('Simulating notes file download...')}
                >
                  <Download size={14} /> Download
                </button>
              )
            }
          ]}
          data={materials}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Upload Study Material">
        <form onSubmit={handleUpload}>
          <Input
            label="Document / Material Title"
            name="title"
            value={newMat.title}
            onChange={(e) => setNewMat({ ...newMat, title: e.target.value })}
            placeholder="e.g. Thermodynamics Cheat Sheet & Formulas"
            required
          />
          <div className="row g-2">
            <div className="col-6">
              <Select
                label="Class / Stream"
                name="standard"
                value={newMat.standard}
                onChange={(e) => setNewMat({ ...newMat, standard: e.target.value })}
                options={['12th Science', '11th Science', '12th Commerce', '11th Commerce', 'NEET Special']}
              />
            </div>
            <div className="col-6">
              <Select
                label="Material Type"
                name="fileType"
                value={newMat.fileType}
                onChange={(e) => setNewMat({ ...newMat, fileType: e.target.value })}
                options={['PDF Document', 'Handwritten Notes', 'Question Bank', 'Presentation Slides']}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Publish to Students</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
