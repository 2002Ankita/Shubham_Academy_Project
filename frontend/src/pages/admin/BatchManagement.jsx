import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import batchService from '../../services/batchService';

export default function BatchManagement() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [formData, setFormData] = useState({ name: '', standard: '', subject: '', room: '', time: '', student_count: 0, teacher_name: '' });

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const data = await batchService.getBatches();
      setBatches(data);
    } catch (err) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBatch) {
        await batchService.updateBatch(editingBatch.id, { ...formData, student_count: Number(formData.student_count) });
        toast.success('Batch updated successfully');
      } else {
        await batchService.createBatch({ ...formData, student_count: Number(formData.student_count) });
        toast.success('Batch created successfully');
      }
      setModalOpen(false);
      setEditingBatch(null);
      fetchBatches();
    } catch (err) {
      toast.error(editingBatch ? 'Failed to update batch' : 'Failed to create batch');
    }
  };

  const handleEdit = (batch) => {
    setFormData({
      name: batch.name || '',
      standard: batch.standard || '',
      subject: batch.subject || '',
      room: batch.room || '',
      time: batch.time || '',
      student_count: batch.student_count || 0,
      teacher_name: batch.teacher_name || ''
    });
    setEditingBatch(batch);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({ name: '', standard: '', subject: '', room: '', time: '', student_count: 0, teacher_name: '' });
    setEditingBatch(null);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        await batchService.deleteBatch(id);
        toast.success('Batch deleted');
        fetchBatches();
      } catch (err) {
        toast.error('Failed to delete batch');
      }
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h3 className="brand-font fw-bold text-sa-charcoal m-0 fs-4">Batch Management</h3>
          <span className="small text-sa-muted">Manage class batches, schedules, and assigned rooms</span>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreateModal}>Create Batch</Button>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'name', title: 'Batch Name', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'standard', title: 'Standard' },
            { key: 'subject', title: 'Subject' },
            { key: 'room', title: 'Lecture Hall' },
            { key: 'time', title: 'Schedule / Time' },
            { key: 'student_count', title: 'Students' },
            { key: 'teacher_name', title: 'Teacher' },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val, row) => (
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(row)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(val)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            }
          ]}
          data={batches}
          loading={loading}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingBatch(null); }} title={editingBatch ? "Edit Batch" : "Create New Batch"}>
        <form onSubmit={handleSubmit}>
          <Input label="Batch Name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. 11th pcm tarabai park" />
          <div className="row g-2">
            <div className="col-6">
              <Input label="Standard" name="standard" value={formData.standard} onChange={handleChange} required placeholder="e.g. 11th Science" />
            </div>
            <div className="col-6">
              <Input label="Subject" name="subject" value={formData.subject} onChange={handleChange} required placeholder="e.g. Physics, Chemistry, Maths" />
            </div>
          </div>
          <div className="row g-2">
            <div className="col-4">
              <Input label="Lecture Hall" name="room" value={formData.room} onChange={handleChange} required placeholder="e.g. Hall A" />
            </div>
            <div className="col-4">
              <Input label="Time Schedule" name="time" value={formData.time} onChange={handleChange} required placeholder="e.g. Mon-Sat (08:00 AM)" />
            </div>
            <div className="col-4">
              <Input label="Student Count" name="student_count" type="number" value={formData.student_count} onChange={handleChange} required />
            </div>
          </div>
          <div className="mt-2">
            <Input label="Teacher Name" name="teacher_name" value={formData.teacher_name || ''} onChange={handleChange} placeholder="e.g. Mr. Sharma" />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => { setModalOpen(false); setEditingBatch(null); }}>Cancel</Button>
            <Button type="submit" variant="primary">{editingBatch ? "Update Batch" : "Create Batch"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
