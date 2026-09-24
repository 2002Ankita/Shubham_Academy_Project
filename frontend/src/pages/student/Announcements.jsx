import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import noticeService from '../../services/noticeService';
import { Bell, Calendar } from 'lucide-react';

export default function StudentAnnouncements() {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const fetchNotices = async () => {
      const data = await noticeService.getAll();
      setNotices(data);
    };
    fetchNotices();
  }, []);

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Academy Notices & Bulletins
        </h3>
        <span className="small text-sa-muted">
          Official academy announcements, examination updates, and holiday circulars
        </span>
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
                  <p className="text-sa-muted small mb-0 mt-1" style={{ fontSize: '0.82rem' }}>
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
            {
              key: 'priority',
              title: 'Priority',
              render: (val) => <span className={val === 'High' ? 'badge-danger' : 'badge-active'}>{val}</span>
            },
            { key: 'publishedDate', title: 'Published' },
            { key: 'author', title: 'Office / Faculty' }
          ]}
          data={notices}
        />
      </div>
    </div>
  );
}
