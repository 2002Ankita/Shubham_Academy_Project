import React, { useState } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { Truck, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

export default function NotesDelivery() {
  const [deliveries, setDeliveries] = useState([
    { id: 'DEL-991', studentName: 'Aarav Deshmukh', rollNumber: 'SA-2026-1042', bookTitle: 'Physics Vol. 2: Optics & Waves', status: 'Delivered', date: '2026-09-12', verifiedBy: 'Library Desk' },
    { id: 'DEL-992', studentName: 'Ananya Sharma', rollNumber: 'SA-2026-1043', bookTitle: 'Chemistry Vol. 1: Organic Foundations', status: 'Pending Pickup', date: '--', verifiedBy: '--' },
    { id: 'DEL-993', studentName: 'Rohan Joshi', rollNumber: 'SA-2026-1044', bookTitle: 'Mathematics: Calculus & Vectors Guide', status: 'Delivered', date: '2026-09-15', verifiedBy: 'Admin Counter' },
    { id: 'DEL-994', studentName: 'Tanvi Kulkarni', rollNumber: 'SA-2026-1045', bookTitle: 'Economics Term 1 Question Bank', status: 'Pending Pickup', date: '--', verifiedBy: '--' },
  ]);

  const [editingDelivery, setEditingDelivery] = useState(null);

  const handleMarkDelivered = (id, studentName) => {
    setDeliveries(deliveries.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: 'Delivered',
          date: new Date().toISOString().split('T')[0],
          verifiedBy: 'Admin Counter'
        };
      }
      return d;
    }));
    toast.success(`Book set delivery logged for ${studentName}!`);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setDeliveries(deliveries.map(d => d.id === editingDelivery.id ? editingDelivery : d));
    setEditingDelivery(null);
    toast.success('Delivery record updated successfully!');
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Notes Delivery & Student Pickup Desk
        </h3>
        <span className="small text-sa-muted">
          Verify physical study material handout upon student RFID card scan
        </span>
      </div>

      {editingDelivery && (
        <form onSubmit={handleUpdate} className="sa-card p-4 bg-light">
          <h5>Edit Delivery: {editingDelivery.id}</h5>
          <div className="row g-3 mt-2">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold">Student Name</label>
              <input type="text" className="form-control" value={editingDelivery.studentName} onChange={e => setEditingDelivery({...editingDelivery, studentName: e.target.value})} required />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold">Roll No.</label>
              <input type="text" className="form-control" value={editingDelivery.rollNumber} onChange={e => setEditingDelivery({...editingDelivery, rollNumber: e.target.value})} required />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold">Material Package</label>
              <input type="text" className="form-control" value={editingDelivery.bookTitle} onChange={e => setEditingDelivery({...editingDelivery, bookTitle: e.target.value})} required />
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
        />
      </div>
    </div>
  );
}
