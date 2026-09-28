import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import noticeService from '../../services/noticeService';
import { Bell, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TeacherAnnouncements() {
  const [notices, setNotices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    category: 'Academic',
    priority: 'Normal',
    targetAudience: 'Class 12th Students Only',
    content: ''
  });

  const fetchNotices = async () => {
    const data = await noticeService.getAll();
    setNotices(data);
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    await noticeService.create({ ...newNotice, author: 'Dr. Priya Kulkarni (Physics Faculty)' });
    toast.success('Class announcement published!');
    setModalOpen(false);
    fetchNotices();
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '16px', minWidth: 0, boxSizing: 'border-box' }}>
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 pt-0 pb-0.5">
        <div>
          <h1 className="brand-font fw-bold m-0" style={{ fontSize: '23px', lineHeight: 1.25, color: '#0F172A' }}>
            Class Announcements & Circulars
          </h1>
          <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
            Send assignment deadlines, lab instructions, and test dates to students
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn d-inline-flex align-items-center gap-1.5 text-white border-0 fw-semibold shadow-xs"
          style={{
            backgroundColor: '#8B1216',
            fontSize: '13px',
            padding: '8px 16px',
            borderRadius: '8px',
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.92)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
        >
          <Plus size={16} />
          <span>Create Class Announcement</span>
        </button>
      </div>

      <Table
        columns={[
          {
            key: 'title',
            title: 'Announcement Title',
            render: (val, row) => (
              <div>
                <span className="fw-semibold text-sa-charcoal d-block">{val}</span>
                <p className="text-secondary small mb-0 mt-1 line-clamp-2" style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  {row.content}
                </p>
              </div>
            )
          },
          { key: 'category', title: 'Category' },
          { key: 'targetAudience', title: 'Target Class' },
          { key: 'publishedDate', title: 'Date' },
          { key: 'author', title: 'Issued By' }
        ]}
        data={notices}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Post Class Announcement">
        <form onSubmit={handlePost}>
          <Input
            label="Announcement Title"
            name="title"
            value={newNotice.title}
            onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
            placeholder="e.g. Physics Assignment 4 Submission by Friday"
            required
          />
          <Select
            label="Target Audience"
            name="targetAudience"
            value={newNotice.targetAudience}
            onChange={(e) => setNewNotice({ ...newNotice, targetAudience: e.target.value })}
            options={['12th Science - Alpha', '11th Science - Beta', 'NEET Intensive', 'All Students & Teachers']}
          />
          <div className="mb-3">
            <label className="form-label">Message Details</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Enter complete instructions for students..."
              value={newNotice.content}
              onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
              required
            />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Broadcast</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
