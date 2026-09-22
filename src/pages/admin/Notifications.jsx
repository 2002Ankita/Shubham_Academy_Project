import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import notificationService from '../../services/notificationService';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async () => {
    await notificationService.markAllAsRead();
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
            Event triggers, RFID scans, fee acknowledgments and system dispatches
          </span>
        </div>

        <Button variant="outline" icon={CheckCheck} onClick={handleMarkRead}>
          Mark All As Read
        </Button>
      </div>

      <div className="sa-card p-4">
        <div className="d-flex flex-column gap-3">
          {notifications.map((n, i) => (
            <div
              key={n.id || i}
              className={`p-3 rounded-3 border d-flex align-items-start justify-content-between gap-3 ${
                n.read ? 'bg-light bg-opacity-50' : 'bg-white shadow-sm border-start border-4 border-sa-primary'
              }`}
            >
              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded-circle bg-sa-primary bg-opacity-10 text-sa-primary mt-1">
                  <Bell size={18} />
                </div>
                <div>
                  <h6 className="fw-bold text-sa-charcoal mb-1 fs-6">{n.title}</h6>
                  <p className="text-sa-muted small mb-0">{n.message}</p>
                </div>
              </div>
              <span className="small text-sa-muted d-flex align-items-center gap-1 flex-shrink-0" style={{ fontSize: '0.78rem' }}>
                <Clock size={13} /> {n.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
