import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Truck, CheckCircle2, Clock, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import inventoryService from '../../services/inventoryService';

export default function NotesDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newDelivery, setNewDelivery] = useState({ studentId: '', inventoryItemId: '' });
  
  const fetchDeliveries = async () => {
    try {
      const data = await inventoryService.getDeliveries();
      setDeliveries(data);
    } catch (err) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const data = await inventoryService.getItems();
      setInventoryItems(data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchDeliveries();
    fetchItems();
  }, []);

  const [editingDelivery, setEditingDelivery] = useState(null);

  const handleMarkDelivered = async (id, studentName) => {
    try {
      await inventoryService.updateDeliveryStatus(id, 'Delivered', null);
      toast.success(`Book set delivery logged for ${studentName}!`);
      fetchDeliveries();
    } catch (err) {
      toast.error('Failed to log delivery');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.updateDeliveryStatus(editingDelivery.id, editingDelivery.status, null);
      setEditingDelivery(null);
      toast.success('Delivery record updated successfully!');
      fetchDeliveries();
    } catch (err) {
      toast.error('Failed to update delivery');
    }
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.createDelivery({
        student_id: newDelivery.studentId,
        inventory_item_id: newDelivery.inventoryItemId
      });
      toast.success('New delivery logged successfully!');
      setModalOpen(false);
      setNewDelivery({ studentId: '', inventoryItemId: '' });
      fetchDeliveries();
    } catch (err) {
      toast.error('Failed to log new delivery. Check Student ID.');
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Notes Delivery & Student Pickup Desk
          </h3>
          <span className="small text-sa-muted">
            Verify physical study material handout upon student RFID card scan
          </span>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
          Log New Delivery
        </Button>
      </div>

      {editingDelivery && (
        <form onSubmit={handleUpdate} className="sa-card p-4 bg-light">
          <h5>Edit Delivery: {editingDelivery.id}</h5>
          <div className="row g-3 mt-2">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold">Student Name</label>
              <input type="text" className="form-control" value={editingDelivery.studentName} disabled />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold">Roll No.</label>
              <input type="text" className="form-control" value={editingDelivery.rollNumber} disabled />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold">Material Package</label>
              <input type="text" className="form-control" value={editingDelivery.bookTitle} disabled />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold">Delivery Status</label>
              <select className="form-select" value={editingDelivery.status} onChange={e => setEditingDelivery({...editingDelivery, status: e.target.value})}>
                <option value="Pending Pickup">Pending Pickup</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
            <div className="col-12 d-flex align-items-end gap-2">
              <Button type="submit" variant="primary">Save Changes</Button>
              <Button variant="outline" onClick={() => setEditingDelivery(null)}>Cancel</Button>
            </div>
          </div>
        </form>
      )}

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'id', title: 'Delivery Tracking ID', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'studentName', title: 'Student Name' },
            { key: 'rollNumber', title: 'Roll No.' },
            { key: 'bookTitle', title: 'Material Package' },
            {
              key: 'status',
              title: 'Delivery Status',
              render: (val) => (
                <span className={val === 'Delivered' ? 'badge-paid' : 'badge-pending'}>
                  {val === 'Delivered' ? <CheckCircle2 size={12} /> : <Clock size={12} />} {val}
                </span>
              )
            },
            { key: 'date', title: 'Handover Date' },
            { key: 'verifiedBy', title: 'Staff Verification' },
            {
              key: 'id',
              title: 'Action',
              align: 'end',
              render: (val, row) => (
                <div className="d-flex gap-2 justify-content-end align-items-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border p-1 text-primary"
                    onClick={() => setEditingDelivery(row)}
                  >
                    Edit
                  </button>
                  {row.status === 'Pending Pickup' ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleMarkDelivered(val, row.studentName)}
                    >
                      Confirm Handover
                    </Button>
                  ) : (
                    <span className="small text-success fw-semibold">Completed</span>
                  )}
                </div>
              )
            }
          ]}
          data={deliveries}
          loading={loading}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log New Delivery">
        <form onSubmit={handleCreateDelivery}>
          <Input
            label="Student Roll No / ID"
            name="studentId"
            value={newDelivery.studentId}
            onChange={(e) => setNewDelivery({ ...newDelivery, studentId: e.target.value })}
            placeholder="e.g. STU-001"
            required
          />
          <div className="mb-3">
            <label className="form-label small fw-bold">Select Material Package</label>
            <select
              className="form-select"
              value={newDelivery.inventoryItemId}
              onChange={(e) => setNewDelivery({ ...newDelivery, inventoryItemId: e.target.value })}
              required
            >
              <option value="">-- Select Material --</option>
              {inventoryItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.in_stock} left)
                </option>
              ))}
            </select>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Log Delivery</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
