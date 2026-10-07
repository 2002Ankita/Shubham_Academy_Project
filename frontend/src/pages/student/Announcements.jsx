import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Table from '../../components/common/Table';
import noticeService from '../../services/noticeService';
import notificationService from '../../services/notificationService';
import { Bell, Calendar, Clock, Building2, Megaphone, X, Eye, FileText, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';

const DELETED_STORAGE_KEY = 'sa_student_deleted_announcements';

const getDeletedNoticeIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveDeletedNoticeIds = (ids) => {
  try {
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('Error saving deleted announcements:', err);
  }
};

const formatNoticeTime = (dateStr) => {
  if (!dateStr) return '10:00 AM';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '10:00 AM';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '10:00 AM';
  }
};

export default function StudentAnnouncements() {
  const location = useLocation();
  const [notices, setNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletedCount, setDeletedCount] = useState(0);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    const deletedIds = getDeletedNoticeIds();
    setDeletedCount(deletedIds.length);

    // 1. Load official announcement notifications
    const officialNotifs = notificationService.getAllAnnouncements(false).map((n) => ({
      id: n.id,
      title: n.title,
      content: n.message,
      details: n.details,
      category: n.category,
      priority: n.priority,
      date: n.date,
      time: n.time,
      publishedDate: n.date,
      author: n.author,
      isNotification: true
    }));

    try {
      const apiNotices = await noticeService.getAll();
      let combined = [...officialNotifs];

      if (apiNotices && Array.isArray(apiNotices) && apiNotices.length > 0) {
        const formattedApi = apiNotices.map((n) => ({
          ...n,
          date: n.publishedDate || '05 Oct 2026',
          time: n.created_at ? formatNoticeTime(n.created_at) : '10:00 AM',
          details: n.content || 'Official academic announcement from academy office.'
        }));

        formattedApi.forEach((an) => {
          if (!combined.some((c) => c.title.toLowerCase() === an.title.toLowerCase())) {
            combined.push(an);
          }
        });
      }

      // Filter out deleted notices for this specific student only
      const filtered = combined.filter((n) => !deletedIds.includes(n.id));
      setNotices(filtered);
    } catch (err) {
      console.warn('Using default notices list:', err);
      const filtered = officialNotifs.filter((n) => !deletedIds.includes(n.id));
      setNotices(filtered);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Sync selected notice from router navigation state or localStorage
  useEffect(() => {
    const deletedIds = getDeletedNoticeIds();
    if (location.state?.selectedNotice && !deletedIds.includes(location.state.selectedNotice.id)) {
      setSelectedNotice(location.state.selectedNotice);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const stored = notificationService.getSelectedNotice();
      if (stored && !deletedIds.includes(stored.id)) {
        setSelectedNotice(stored);
      }
    }
  }, [location.state]);

  // Per-student delete announcement handler
  const handleDeleteNotice = (noticeToDelete, e) => {
    if (e) e.stopPropagation();
    const id = noticeToDelete.id;
    const deletedIds = getDeletedNoticeIds();

    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      saveDeletedNoticeIds(deletedIds);
      setDeletedCount(deletedIds.length);
    }

    setNotices((prev) => prev.filter((n) => n.id !== id));

    // Clear detail view if this announcement is currently opened
    if (selectedNotice?.id === id) {
      setSelectedNotice(null);
      notificationService.clearSelectedNotice();
    }

    // Also mark as read in notifications so top bell count doesn't keep it
    notificationService.markAsRead(id);
    toast.success(`"${noticeToDelete.title}" removed from your bulletins.`);
  };

  // Restore deleted notices for student
  const handleRestoreAll = () => {
    saveDeletedNoticeIds([]);
    setDeletedCount(0);
    toast.info('All deleted bulletins restored to your portal.');
    fetchNotices();
  };

  const columns = [
    {
      key: 'title',
      title: 'Announcement',
      render: (val, row) => (
        <div>
          <span className="fw-bold text-sa-charcoal d-block" style={{ fontSize: '0.88rem' }}>
            {val}
          </span>
          <p className="text-sa-muted small mb-0 mt-0.5" style={{ fontSize: '0.78rem', maxWidth: '380px' }}>
            {row.content || (row.details && row.details.slice(0, 80) + '...')}
          </p>
        </div>
      )
    },
    {
      key: 'category',
      title: 'Category',
      render: (val) => (
        <span className="badge bg-light text-dark border" style={{ fontSize: '0.76rem' }}>
          {val || 'General'}
        </span>
      )
    },
    {
      key: 'dateTime',
      title: 'Date & Time',
      render: (_, row) => (
        <div style={{ fontSize: '0.80rem', whiteSpace: 'nowrap' }}>
          <div className="d-flex align-items-center gap-1.5 text-sa-charcoal fw-semibold">
            <Calendar size={13} className="text-sa-primary" />
            <span>{row.date || row.publishedDate || '05 Oct 2026'}</span>
          </div>
          <div className="d-flex align-items-center gap-1.5 text-sa-muted mt-0.5">
            <Clock size={12} />
            <span>{row.time || '10:00 AM'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'author',
      title: 'Office / Faculty',
      render: (val) => (
        <span className="small text-sa-charcoal fw-medium" style={{ fontSize: '0.80rem' }}>
          {val || 'Academy Admin'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, row) => {
        const isSelected = selectedNotice?.id === row.id || selectedNotice?.title === row.title;
        return (
          <div className="d-flex align-items-center gap-1.5">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 transition-all ${
                isSelected ? 'btn-crimson text-white' : 'btn-outline-danger'
              }`}
              style={{
                fontSize: '0.74rem',
                borderColor: isSelected ? '#881337' : '#E2E8F0',
                backgroundColor: isSelected ? '#881337' : 'transparent',
                color: isSelected ? '#fff' : '#881337',
                fontWeight: 600,
                boxShadow: isSelected ? '0 2px 8px rgba(136, 19, 55, 0.25)' : 'none'
              }}
              onClick={() => {
                setSelectedNotice(row);
                notificationService.setSelectedNotice(row);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              title="View full announcement details"
            >
              <Eye size={12} /> {isSelected ? 'Viewing' : 'View'}
            </button>

            <button
              type="button"
              className="btn btn-sm rounded-pill px-2 py-1 btn-light border text-danger d-flex align-items-center gap-1 transition-all"
              style={{
                fontSize: '0.74rem',
                backgroundColor: '#FFF5F5',
                borderColor: '#FED7D7'
              }}
              onClick={(e) => handleDeleteNotice(row, e)}
              title="Delete announcement from your portal"
            >
              <Trash2 size={12} />
              <span className="d-none d-md-inline">Delete</span>
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="d-flex flex-column gap-4">
      {/* Page Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            Academy Notices & Bulletins
          </h3>
          <span className="small text-sa-muted">
            Official academy announcements, examination updates, RFID attendance logs, and fee circulars
          </span>
        </div>

        {deletedCount > 0 && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5"
            style={{ fontSize: '0.78rem' }}
            onClick={handleRestoreAll}
            title="Restore all previously deleted announcements to your portal"
          >
            <RotateCcw size={13} />
            <span>Restore Removed ({deletedCount})</span>
          </button>
        )}
      </div>

      {/* Detailed Announcement View (when notification or list item is clicked) */}
      {selectedNotice && (
        <div
          id="detailed-announcement-view"
          className="sa-card p-4 shadow-sm transition-all"
          style={{
            border: '2px solid rgba(136, 19, 55, 0.35)',
            backgroundColor: '#FFFBFC',
            borderRadius: '16px',
            position: 'relative',
            boxShadow: '0 8px 24px -4px rgba(136, 19, 55, 0.12), 0 4px 8px -2px rgba(136, 19, 55, 0.06)',
            transition: 'all 0.25s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#881337';
            e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(136, 19, 55, 0.2), 0 6px 12px -2px rgba(136, 19, 55, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(136, 19, 55, 0.35)';
            e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(136, 19, 55, 0.12), 0 4px 8px -2px rgba(136, 19, 55, 0.06)';
            e.currentTarget.style.transform = 'translateY(0px)';
          }}
        >
          {/* Header row */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pb-3 mb-3 border-bottom">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span
                className="badge rounded-pill"
                style={{ backgroundColor: '#881337', color: '#fff', fontSize: '0.78rem', padding: '0.45em 0.8em' }}
              >
                <Megaphone size={13} className="me-1" />
                {selectedNotice.category || 'Official Bulletin'}
              </span>
              <span className="badge bg-light text-muted border rounded-pill" style={{ fontSize: '0.75rem' }}>
                Ref: {selectedNotice.id || 'ANNC-OFFICIAL'}
              </span>
            </div>

            {/* Actions for detailed card */}
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 d-flex align-items-center gap-1.5"
                style={{ fontSize: '0.76rem', backgroundColor: '#FFF5F5' }}
                onClick={() => handleDeleteNotice(selectedNotice)}
                title="Delete this announcement from your bulletins"
              >
                <Trash2 size={13} />
                <span>Delete from My Bulletins</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 d-flex align-items-center gap-1"
                style={{ fontSize: '0.76rem' }}
                onClick={() => {
                  setSelectedNotice(null);
                  notificationService.clearSelectedNotice();
                }}
              >
                <X size={14} /> Close View
              </button>
            </div>
          </div>

          {/* Announcement Title */}
          <h4 className="brand-font fw-extrabold text-sa-charcoal mb-2 fs-5" style={{ color: '#1E293B' }}>
            {selectedNotice.title}
          </h4>

          {/* Date, Time & Office Details Banner */}
          <div
            className="d-flex flex-wrap align-items-center gap-3 p-2.5 rounded-3 mb-3"
            style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.84rem' }}
          >
            <div className="d-flex align-items-center gap-1.5 text-sa-charcoal">
              <Calendar size={16} className="text-sa-primary" />
              <strong className="text-secondary">Date:</strong>
              <span className="fw-semibold">{selectedNotice.date || selectedNotice.publishedDate || '05 Oct 2026'}</span>
            </div>

            <div className="vr d-none d-sm-block my-1" style={{ height: '16px', opacity: 0.25 }} />

            <div className="d-flex align-items-center gap-1.5 text-sa-charcoal">
              <Clock size={16} className="text-sa-primary" />
              <strong className="text-secondary">Time:</strong>
              <span className="fw-semibold">{selectedNotice.time || '10:00 AM'}</span>
            </div>

            <div className="vr d-none d-sm-block my-1" style={{ height: '16px', opacity: 0.25 }} />

            <div className="d-flex align-items-center gap-1.5 text-sa-charcoal">
              <Building2 size={16} className="text-sa-primary" />
              <strong className="text-secondary">Issued By:</strong>
              <span className="fw-semibold">{selectedNotice.author || 'Academy Administration'}</span>
            </div>
          </div>

          {/* In-Detail Announcement Description Content */}
          <div
            className="p-3.5 rounded-3 bg-white border"
            style={{ borderColor: '#F1F5F9', minHeight: '80px' }}
          >
            <h6 className="fw-bold text-sa-primary mb-2" style={{ fontSize: '0.88rem' }}>
              Announcement In Detail:
            </h6>
            <p
              className="mb-0 text-sa-charcoal"
              style={{ fontSize: '0.92rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}
            >
              {selectedNotice.details || selectedNotice.content}
            </p>
          </div>
        </div>
      )}

      {/* Announcements Table */}
      <div className="sa-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="fw-bold text-sa-charcoal small">
            All Academy Bulletins ({notices.length})
          </span>
          <span className="text-sa-muted small">
            Click &apos;View&apos; to inspect or &apos;Delete&apos; to remove from your bulletins
          </span>
        </div>
        <Table
          columns={columns}
          data={notices}
          loading={loading}
          emptyMessage="No notices or circulars available in your bulletin board."
        />
      </div>
    </div>
  );
}
