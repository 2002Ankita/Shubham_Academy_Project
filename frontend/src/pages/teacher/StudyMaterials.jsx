import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Plus, Download, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import materialService from '../../services/materialService';

export default function TeacherStudyMaterials() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newMat, setNewMat] = useState({ title: '', standard: '', subject: 'Physics', fileType: 'PDF Document', description: '' });
  const fileInputRef = useRef(null);
  
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await materialService.getMaterials();
      setMaterials(data);
    } catch (err) {
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files[0];
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', newMat.title);
    formData.append('standard', newMat.standard);
    formData.append('subject', newMat.subject);
    formData.append('fileType', newMat.fileType);
    if (newMat.description) {
      formData.append('description', newMat.description);
    }

    try {
      await materialService.uploadMaterial(formData);
      toast.success('Study notes uploaded to student portal!');
      setModalOpen(false);
      setNewMat({ title: '', standard: '', subject: 'Physics', fileType: 'PDF Document', description: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMaterials();
    } catch (err) {
      toast.error('Failed to upload material');
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/teacher/dashboard')}
            className="btn btn-light d-inline-flex align-items-center justify-content-center border shadow-sm"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              borderColor: '#E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: 0,
              cursor: 'pointer'
            }}
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Study Materials & Lecture Notes
            </h3>
            <span className="small text-sa-muted">
              Share chapter summaries, practice problems, and laboratory guides
            </span>
          </div>
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
              key: 'downloadAction',
              title: 'Action',
              align: 'end',
              render: (val, item) => (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={async () => {
                    try {
                      toast.info(`Downloading "${item.title}"...`);
                      await materialService.downloadMaterial(item.id, item.title);
                      toast.success('Download complete');
                    } catch (err) {
                      toast.error('Failed to download file');
                    }
                  }}
                >
                  <Download size={14} /> Download
                </button>
              )
            }
          ]}
          data={materials}
          loading={loading}
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
            <div className="col-12 col-md-4">
              <Select
                label="Class / Stream"
                name="standard"
                value={newMat.standard}
                onChange={(e) => setNewMat({ ...newMat, standard: e.target.value })}
                options={[
                  '11th pcm tarabai park',
                  '11th pcb tarabai park',
                  '11th pcmb tarabai park',
                  '12th pcm tarabai park',
                  '12th pcb tarabai park',
                  '12th pcmb tarabai park',
                  '11th pcm Mangalvar peth',
                  '11th pcb Mangalvar peth',
                  '11th pcmb Mangalvar peth',
                  '12th pcm Mangalvar peth',
                  '12th pcb Mangalvar peth',
                  '12th pcmb Mangalvar peth'
                ]}
                required
              />
            </div>
            <div className="col-12 col-md-4">
              <Select
                label="Subject"
                name="subject"
                value={newMat.subject}
                onChange={(e) => setNewMat({ ...newMat, subject: e.target.value })}
                options={['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English']}
              />
            </div>
            <div className="col-12 col-md-4">
              <Select
                label="Material Type"
                name="fileType"
                value={newMat.fileType}
                onChange={(e) => setNewMat({ ...newMat, fileType: e.target.value })}
                options={['PDF Document', 'Handwritten Notes', 'Question Bank', 'Presentation Slides']}
              />
            </div>
          </div>
          
          <Input
            label="Description (Optional)"
            name="description"
            value={newMat.description}
            onChange={(e) => setNewMat({ ...newMat, description: e.target.value })}
            placeholder="Brief description of the material..."
          />
          
          <div className="mb-3 mt-2">
            <label className="form-label small fw-bold">Select File</label>
            <input 
              type="file" 
              className="form-control" 
              ref={fileInputRef} 
              required
            />
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
