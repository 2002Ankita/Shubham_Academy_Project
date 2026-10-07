import React, { useState, useEffect, useContext } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { BookOpen, Users, Calendar, MapPin, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import batchService from '../../services/batchService';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';

export default function MyClasses() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editForm, setEditForm] = useState({ time: '', room: '', date: '' });

  const fetchBatches = async () => {
    try {
      const data = await batchService.getBatches();
      const myBatches = data.filter(b => !b.teacher_name || b.teacher_name === user?.name);
      
      const mappedClasses = myBatches.map(b => ({
        originalId: b.id, // keep original ID for updating
        id: b.id ? `CLS-${b.id.substring(b.id.length - 4).toUpperCase()}` : 'N/A',
        name: b.name || 'Unnamed Batch',
        subject: b.subject || 'N/A',
        studentsCount: b.student_count || 0,
        time: b.time || 'TBD',
        date: b.date || '',
        room: b.room || 'TBD',
        standard: b.standard || '',
        teacher_name: b.teacher_name || '',
        student_count: b.student_count || 0
      }));
      setClasses(mappedClasses);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [user]);

  const openEditModal = (c) => {
    setEditingClass(c);
    setEditForm({ time: c.time, room: c.room, date: c.date });
    setEditModalOpen(true);
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    if (!editingClass) return;
    try {
      // Retain old values, update time and room
      await batchService.updateBatch(editingClass.originalId, {
        name: editingClass.name,
        standard: editingClass.standard,
        subject: editingClass.subject,
        student_count: editingClass.student_count,
        teacher_name: editingClass.teacher_name,
        time: editForm.time,
        date: editForm.date,
        room: editForm.room
      });
      toast.success('Schedule updated successfully');
      setEditModalOpen(false);
      fetchBatches(); // Refetch to show updated data
    } catch (err) {
      toast.error('Failed to update schedule');
    }
  };

  return (
    <div className="d-flex flex-column w-100" style={{ gap: '16px', minWidth: 0, boxSizing: 'border-box' }}>
      <style>{`
        .teacher-class-card {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          box-sizing: border-box;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .teacher-class-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
      `}</style>

      {/* Header */}
      <div className="d-flex flex-column pt-0 pb-0.5">
        <h1 className="brand-font fw-bold m-0" style={{ fontSize: '23px', lineHeight: 1.25, color: '#0F172A' }}>
          My Classes & Timetable
        </h1>
        <p className="m-0 mt-0.5" style={{ fontSize: '13.5px', color: '#64748B' }}>
          Active teaching batches, course syllabus pacing, and classroom schedules
        </p>
      </div>

      <div className="row g-3">
        {loading ? (
          <div className="col-12 text-center py-4 text-muted">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="col-12 text-center py-4 text-muted">No classes assigned yet.</div>
        ) : (
          classes.map((c, i) => (
            <div key={i} className="col-12 col-md-4">
              <div className="teacher-class-card p-3.5 h-100 d-flex flex-column justify-content-between" style={{ padding: '18px 20px' }}>
                <div>
                  <span
                    className="badge mb-2 d-inline-block"
                    style={{
                      backgroundColor: '#FEE2E2',
                      color: '#8B1216',
                      border: '1px solid #FECACA',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    {c.id}
                  </span>
                  <h2 className="brand-font fw-bold m-0 mb-1" style={{ fontSize: '16px', color: '#0F172A' }}>
                    {c.name}
                  </h2>
                  <span className="small fw-semibold d-block mb-3" style={{ color: '#D97706', fontSize: '12.5px' }}>
                    {c.subject}
                  </span>

                  <div className="d-flex flex-column gap-2 small text-secondary">
                    <div className="d-flex align-items-center gap-2">
                      <Users size={15} style={{ color: '#64748B' }} />
                      <span style={{ fontSize: '12.5px', color: '#475569' }}>{c.studentsCount} Students Enrolled</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Calendar size={15} style={{ color: '#64748B' }} />
                      <span style={{ fontSize: '12.5px', color: '#475569' }}>
                        {c.time} {c.date && <span className="ms-1 fw-medium" style={{ color: '#0F172A' }}>({c.date})</span>}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <MapPin size={15} style={{ color: '#64748B' }} />
                      <span style={{ fontSize: '12.5px', color: '#475569' }}>{c.room}</span>
                    </div>
                  </div>
                  
                  <button
                    className="btn btn-sm text-primary p-0 d-flex align-items-center gap-1 mt-2"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                    onClick={() => openEditModal(c)}
                  >
                    <Edit2 size={13} /> Edit Schedule
                  </button>
                </div>

                <div className="pt-3 border-top mt-3 d-flex gap-2">
                  <Button size="sm" variant="outline" className="w-100" onClick={() => navigate('/teacher/attendance')}>
                    Attendance
                  </Button>
                  <button
                    type="button"
                    className="btn btn-sm w-100 text-white fw-semibold"
                    style={{ backgroundColor: '#8B1216', borderRadius: '8px', fontSize: '12.5px' }}
                    onClick={() => navigate('/teacher/students')}
                  >
                    Students
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Schedule Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Schedule">
        <form onSubmit={handleUpdateSchedule}>
          <div className="mb-3">
            <Input
              label="Date (Optional)"
              type="date"
              value={editForm.date || ''}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <Input
              label="Time Schedule"
              value={editForm.time}
              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
              placeholder="e.g. 08:00 AM"
              required
            />
          </div>
          <div className="mb-3">
            <Input
              label="Room / Location"
              value={editForm.room}
              onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
              placeholder="e.g. Room 101"
              required
            />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" type="button" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
