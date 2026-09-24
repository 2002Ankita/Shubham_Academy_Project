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
                row.status === 'Pending Pickup' ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleMarkDelivered(val, row.studentName)}
                  >
                    Confirm Handover
                  </Button>
                ) : (
                  <span className="small text-success fw-semibold">Completed</span>
                )
              )
            }
          ]}
          data={deliveries}
        />
      </div>
    </div>
  );
}
