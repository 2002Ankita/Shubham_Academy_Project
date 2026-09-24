import React from 'react';
import { Bell, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AnnouncementCard({ notices = [], viewAllLink = '/admin/notices' }) {
  return (
    <div className="sa-card p-4 h-100 d-flex flex-column">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Bell size={18} className="text-sa-primary" />
          <h5 className="brand-font fw-bold m-0 text-sa-charcoal fs-6">Notices & Circulars</h5>
        </div>
        <Link to={viewAllLink} className="small text-sa-primary fw-semibold d-flex align-items-center gap-1">
          <span>View All</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="d-flex flex-column gap-3 flex-grow-1">
        {notices.slice(0, 3).map((notice, idx) => (
          <div key={notice.id || idx} className="p-3 rounded-3 border bg-light bg-opacity-50">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
              <span className={`badge ${notice.priority === 'High' ? 'bg-danger' : 'bg-secondary'} small`}>
                {notice.category || 'General'}
              </span>
              <span className="small text-sa-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                <Calendar size={12} />
                {notice.publishedDate}
              </span>
            </div>
            <h6 className="fw-bold text-sa-charcoal mb-1 fs-6">{notice.title}</h6>
            <p className="small text-sa-muted mb-0 line-clamp-2" style={{ fontSize: '0.82rem' }}>
              {notice.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
