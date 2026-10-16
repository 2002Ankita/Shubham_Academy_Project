import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import notificationService from '../../services/notificationService';
import studentService from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const roleClean = (user?.role || '').toLowerCase().replace('-', '_');
  const isSuperAdmin = roleClean === 'super_admin' || roleClean.includes('super');

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        try {
          const students = await studentService.getAll();
          if (Array.isArray(students)) {
            notificationService.pruneFinalizedDiscounts(students);
            const pending = students.filter(
              s => s.discountStatus === 'PENDING' && Number(s.discountAmount || s.discountRequestedAmount) > 0
            );
            notificationService.syncDiscountApprovals(pending);
          }
        } catch (e) {
          console.warn('Sync pending discounts failed:', e);
        }
      }
      const data = await notificationService.getAll(isSuperAdmin);
      setNotifications(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [isSuperAdmin]);

  const handleMarkRead = async () => {
    await notificationService.markAllAsRead(isSuperAdmin);
    toast.success('All notifications marked as read');
    fetchNotifs();
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
            User Notifications & Alerts
          </h3>
          <span className="small text-sa-muted">
            Event triggers, fee concession requests, RFID scans, and system dispatches
          </span>
        </div>

        <Button variant="outline" icon={CheckCheck} onClick={handleMarkRead}>
          Mark All As Read
        </Button>
      </div>

      <div className="sa-card p-4">
        {loading ? (
          <div className="text-center py-4 text-muted small">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-4 text-muted small">No notifications found</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {notifications.map((n, i) => {
              const isDiscountApproval = n.type === 'discount_approval';
              return (
                <div
                  key={n.id || i}
                  className={`p-3 rounded-3 border d-flex align-items-start justify-content-between gap-3 ${
                    isDiscountApproval
                      ? 'bg-warning-subtle border-warning'
                      : n.read
                        ? 'bg-light bg-opacity-50'
                        : 'bg-white shadow-sm border-start border-4 border-sa-primary'
                  }`}
                >
                  <div className="d-flex align-items-start gap-3 flex-grow-1">
                    <div
                      className={`p-2 rounded-circle mt-1 flex-shrink-0 ${
                        isDiscountApproval
                          ? 'bg-warning text-dark'
                          : 'bg-sa-primary bg-opacity-10 text-sa-primary'
                      }`}
                    >
                      {isDiscountApproval ? <ShieldCheck size={18} /> : <Bell size={18} />}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h6 className="fw-bold text-sa-charcoal mb-0 fs-6">{n.title}</h6>
                        {isDiscountApproval && (
                          <span className="badge bg-warning text-dark small fw-semibold">
                            Superadmin Approval Required
                          </span>
                        )}
                      </div>
                      <p className="text-sa-muted small mb-1" style={{ lineHeight: 1.4 }}>
                        {n.details || n.message}
                      </p>
                      {isDiscountApproval && isSuperAdmin && (
                        <div className="mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-dark d-inline-flex align-items-center gap-1.5 py-1 px-2.5 small rounded-2"
                            onClick={() => navigate('/super-admin/discounts?status=PENDING')}
                          >
                            <span>Open Concession Queue</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className="small text-sa-muted d-flex align-items-center gap-1 flex-shrink-0"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <Clock size={13} /> {n.time || n.formattedDateTime}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
