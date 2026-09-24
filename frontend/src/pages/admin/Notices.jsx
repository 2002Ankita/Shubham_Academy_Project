import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import noticeService from '../../services/noticeService';
import { Bell, Plus, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    category: 'Examinations',
    priority: 'Normal',
    targetAudience: 'All Students & Teachers',
    content: ''
  });

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await noticeService.getAll();
      setNotices(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    await noticeService.create(newNotice);
    toast.success('Notice published to student & parent portals!');
    setModalOpen(false);
    setNewNotice({ title: '', category: 'Examinations', priority: 'Normal', targetAudience: 'All Students & Teachers', content: '' });
    fetchNotices();
  };

  const handleDelete = async (id) => {
    await noticeService.delete(id);
    toast.success('Notice removed');
    fetchNotices();
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Notice Board & Announcements
          </h3>
          <span className="small text-sa-muted">
            Broadcast administrative circulars, schedule changes, and parent alerts
          </span>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
          Post New Notice
        </Button>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            {
              key: 'title',
              title: 'Announcement',
              render: (val, row) => (
                <div>
                  <span className="fw-semibold text-sa-charcoal d-block">{val}</span>
                  <p className="text-sa-muted small mb-0 mt-1 line-clamp-2" style={{ fontSize: '0.8rem' }}>
                    {row.content}
                  </p>
                </div>
              )
            },
            {
              key: 'category',
              title: 'Category',
              render: (val) => <span className="badge bg-light text-dark border">{val}</span>
            },
            { key: 'targetAudience', title: 'Target Audience' },
            {
              key: 'priority',
              title: 'Priority',
              render: (val) => (
                <span className={val === 'High' ? 'badge-danger' : 'badge-active'}>
                  {val}
                </span>
              )
            },
            { key: 'publishedDate', title: 'Published Date' },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val) => (
                <button
                  type="button"
                  className="btn btn-sm btn-light border p-1 text-danger"
                  onClick={() => handleDelete(val)}
                  title="Delete Notice"
                >
                  <Trash2 size={15} />
                </button>
              )
            }
          ]}
          data={notices}
          loading={loading}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Publish Academy Notice">
        <form onSubmit={handleCreateNotice}>
          <Input
            label="Notice Headline / Title"
            name="title"
            value={newNotice.title}
            onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
            placeholder="e.g. Schedule for Preliminary Board Practical Exams"
            required
          />
          <div className="row g-2">
            <div className="col-6">
              <Select
                label="Category"
                name="category"
                value={newNotice.category}
                onChange={(e) => setNewNotice({ ...newNotice, category: e.target.value })}
                options={['Examinations', 'Academic', 'Fee Notice', 'Holiday', 'Study Materials']}
              />
            </div>
            <div className="col-6">
              <Select
                label="Priority Flag"
                name="priority"
                value={newNotice.priority}
                onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
                options={['Normal', 'High']}
              />
            </div>
          </div>
          <Select
            label="Target Audience"
            name="targetAudience"
            value={newNotice.targetAudience}
            onChange={(e) => setNewNotice({ ...newNotice, targetAudience: e.target.value })}
            options={[
              'All Students & Teachers',
              'Class 12th Students Only',
              'Class 11th Students Only',
              'Teachers Only',
              'Parents & Guardians'
            ]}
          />
          <div className="mb-3">
            <label className="form-label">Notice Circular Content</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Provide complete circular details..."
              value={newNotice.content}
              onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
              required
            />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Publish Broadcast</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
