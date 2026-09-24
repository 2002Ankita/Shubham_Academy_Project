import React from 'react';
import Table from '../../components/common/Table';
import { Truck, CheckCircle2, Clock } from 'lucide-react';

export default function StudentNotesDelivery() {
  const deliveries = [
    { id: 'DEL-991', bookTitle: 'Physics Vol. 2: Optics & Waves', status: 'Delivered', date: '2026-09-12', desk: 'Library Desk (Counter 2)' },
    { id: 'DEL-984', bookTitle: 'Chemistry Vol. 1: Organic Foundations', status: 'Delivered', date: '2026-08-20', desk: 'Library Desk' },
    { id: 'DEL-970', bookTitle: 'Mathematics: Calculus & Vectors Guide', status: 'Delivered', date: '2026-08-15', desk: 'Admin Counter' },
    { id: 'DEL-999', bookTitle: 'Physics Vol. 3: Modern Physics & Semiconductors', status: 'In Printing', date: 'Expected Oct 5', desk: 'Publication Center' },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Printed Notes & Study Book Handover
        </h3>
        <span className="small text-sa-muted">
          Track official printed workbook packets and library pickup receipts
        </span>
      </div>

      <div className="sa-card p-4">
        <Table
          columns={[
            { key: 'id', title: 'Package Ref', render: (val) => <span className="fw-bold">{val}</span> },
            { key: 'bookTitle', title: 'Module Workbook Title' },
            {
              key: 'status',
              title: 'Delivery Status',
              render: (val) => (
                <span className={val === 'Delivered' ? 'badge-paid' : 'badge-pending'}>
                  {val === 'Delivered' ? <CheckCircle2 size={13} /> : <Clock size={13} />} {val}
                </span>
              )
            },
            { key: 'date', title: 'Handover / Expected Date' },
            { key: 'desk', title: 'Pickup Counter' }
          ]}
          data={deliveries}
        />
      </div>
    </div>
  );
}
