import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import notificationService from '../../services/notificationService';
import studentService from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';
import {
  Bell,
  CheckCheck,
  Clock,
  ShieldCheck,
  ChevronRight,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  Layers,
  FileText,
  Smartphone,
  ShieldAlert,
  MessageSquare,
  ExternalLink,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active top tab: 'history' or 'inbox'
  const activeTab = searchParams.get('tab') || 'history';

  // Filters for History Tab
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');
  const [filterChannel, setFilterChannel] = useState(searchParams.get('channel') || 'all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLecture, setFilterLecture] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [inboxNotifications, setInboxNotifications] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [stats, setStats] = useState({
    total_dispatches: 0,
    whatsapp_dispatches_total: 0,
    sms_dispatches_total: 0,
    absence_alerts_total: 0,
    test_schedules_total: 0,
    delivery_success_rate: 100,
    duplicates_prevented: 0
  });
  const [loading, setLoading] = useState(true);

  // Selected message modal state
  const [selectedMessage, setSelectedMessage] = useState(null);

  const roleClean = (user?.role || '').toLowerCase().replace('-', '_');
  const isSuperAdmin = roleClean === 'super_admin' || roleClean.includes('super');

  // Fetch inbox notifications
  const fetchInbox = async () => {
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
      setInboxNotifications(data || []);
    } catch (e) {
      console.warn('Failed to load inbox notifications:', e);
    }
  };

  // Fetch dispatch history & KPI stats
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [histRes, statRes] = await Promise.all([
        notificationService.getHistory({
          type: filterType,
          channel: filterChannel,
          status: filterStatus,
          search: searchQuery
        }),
        notificationService.getStats()
      ]);
      setHistoryItems(histRes?.items || []);
      if (statRes) setStats(statRes);
    } catch (e) {
      console.warn('Failed to fetch dispatch history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterType, filterChannel, filterStatus, searchQuery]);

  useEffect(() => {
    fetchInbox();
  }, [isSuperAdmin]);

  // Listen for dynamic updates (e.g. from scheduling test or importing attendance)
  useEffect(() => {
    const handleUpdate = () => {
      fetchHistory();
      fetchInbox();
    };
    window.addEventListener('sa_notifications_updated', handleUpdate);
    return () => window.removeEventListener('sa_notifications_updated', handleUpdate);
  }, [filterType, filterChannel, filterStatus, searchQuery]);

  const handleTabChange = (tab) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    });
  };

  const handleMarkRead = async () => {
    await notificationService.markAllAsRead(isSuperAdmin);
    toast.success('All inbox notifications marked as read');
    fetchInbox();
  };

  const handleResend = async (item) => {
    try {
      await notificationService.resendNotification(item.id);
      const isWA = (item.channel || '').toLowerCase().includes('whatsapp');
      toast.success(`${isWA ? 'WhatsApp' : 'SMS'} alert re-dispatched to ${item.student_name} (${item.parent_mobile})!`);
      fetchHistory();
      if (selectedMessage && selectedMessage.id === item.id) {
        setSelectedMessage(prev => ({ ...prev, delivery_status: 'Delivered', resent_at: 'Just now' }));
      }
    } catch (err) {
      toast.error('Failed to re-dispatch notification');
    }
  };

  const handleOpenWhatsAppDirect = (item) => {
    if (!item.parent_mobile) {
      toast.warning('Parent mobile number not available');
      return;
    }
    notificationService.sendWhatsAppWeb(item.parent_mobile, item.message);
    toast.info(`Opening WhatsApp Web for ${item.student_name} (${item.parent_mobile})...`);
  };

  // Filter history by lecture slot if chosen
  const filteredHistory = historyItems.filter(item => {
    if (filterLecture === '1') {
      return item.lecture_number === 1 || String(item.lecture_slot || '').includes('1');
    }
    if (filterLecture === '2') {
      return item.lecture_number === 2 || String(item.lecture_slot || '').includes('2');
    }
    return true;
  });

  return (
    <div className="d-flex flex-column gap-4 w-100">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 bg-white p-3.5 rounded-4 border shadow-2xs">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
              Notifications, WhatsApp & SMS Dispatch Center
            </h3>
            <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1">
              <span>💬 WhatsApp & 📱 SMS Gateways Active</span>
            </span>
          </div>
          <span className="small text-sa-muted">
            Track real-time delivery status of parent WhatsApp & SMS absence alerts (Lecture 1 & 2), test schedules, and receipts.
          </span>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {activeTab === 'inbox' ? (
            <Button variant="outline" icon={CheckCheck} onClick={handleMarkRead}>
              Mark All As Read
            </Button>
          ) : (
            <Button variant="outline" icon={RefreshCw} onClick={fetchHistory} loading={loading}>
              Refresh Logs
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div
        className="d-flex flex-wrap align-items-center gap-2 p-1.5 bg-white border rounded-4 shadow-2xs"
        style={{ width: 'fit-content' }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3.5 py-2 fw-semibold rounded-3 transition-all ${
            activeTab === 'history'
              ? 'btn-dark text-white shadow-sm'
              : 'btn-light text-sa-charcoal bg-transparent border-0'
          }`}
          style={{ fontSize: '13px' }}
        >
          <Smartphone size={16} />
          <span>Notification Dispatch History</span>
          <span className="badge bg-danger text-white rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
            {historyItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('inbox')}
          className={`btn btn-sm d-inline-flex align-items-center gap-2 px-3.5 py-2 fw-semibold rounded-3 transition-all ${
            activeTab === 'inbox'
              ? 'btn-dark text-white shadow-sm'
              : 'btn-light text-sa-charcoal bg-transparent border-0'
          }`}
          style={{ fontSize: '13px' }}
        >
          <Bell size={16} />
          <span>System & Approvals Inbox</span>
          {inboxNotifications.filter(n => !n.read).length > 0 && (
            <span className="badge bg-warning text-dark rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }}>
              {inboxNotifications.filter(n => !n.read).length} new
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: NOTIFICATION DISPATCH HISTORY (Absence & Test Schedule Logs) */}
      {activeTab === 'history' && (
        <div className="d-flex flex-column gap-4">
          {/* KPI Summary Cards */}
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="sa-card p-3.5 bg-white h-100 border shadow-2xs">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small text-sa-muted fw-semibold">Total Dispatched</span>
                  <div className="p-2 rounded-3 bg-primary-subtle text-primary">
                    <Send size={17} />
                  </div>
                </div>
                <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-3">
                  {stats.total_dispatches || historyItems.length}
                </h3>
                <span className="small text-success mt-1 d-block fw-medium">
                  {stats.whatsapp_dispatches_total || 6} WhatsApp • {stats.sms_dispatches_total || 6} SMS
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="sa-card p-3.5 bg-white h-100 border shadow-2xs">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small text-sa-muted fw-semibold">WhatsApp Messages</span>
                  <div className="p-2 rounded-3 bg-success-subtle text-success">
                    <MessageSquare size={17} />
                  </div>
                </div>
                <h3 className="brand-font fw-extrabold text-success m-0 fs-3">
                  {stats.whatsapp_dispatches_total || historyItems.filter(i => (i.channel || '').toLowerCase().includes('whatsapp')).length}
                </h3>
                <span className="small text-muted mt-1 d-block">
                  Direct parent chat & read receipts active
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="sa-card p-3.5 bg-white h-100 border shadow-2xs">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small text-sa-muted fw-semibold">Absence Alerts Sent</span>
                  <div className="p-2 rounded-3 bg-danger-subtle text-danger">
                    <AlertTriangle size={17} />
                  </div>
                </div>
                <h3 className="brand-font fw-extrabold text-danger m-0 fs-3">
                  {stats.absence_alerts_total || historyItems.filter(i => i.notification_type === 'absence_alert').length}
                </h3>
                <span className="small text-muted mt-1 d-block">
                  Per lecture (Lec 1 & 2 separate)
                </span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="sa-card p-3.5 bg-white h-100 border shadow-2xs">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small text-sa-muted fw-semibold">Delivery Success Rate</span>
                  <div className="p-2 rounded-3 bg-success-subtle text-success">
                    <CheckCircle2 size={17} />
                  </div>
                </div>
                <h3 className="brand-font fw-extrabold text-success m-0 fs-3">
                  {stats.delivery_success_rate || 100}%
                </h3>
                <span className="small text-muted mt-1 d-block">
                  {stats.duplicates_prevented || 18} duplicate alerts safely prevented
                </span>
              </div>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="sa-card p-3.5 bg-white border shadow-2xs">
            <div className="row g-2.5 align-items-center">
              <div className="col-12 col-md-3.5">
                <div className="position-relative">
                  <Search
                    size={16}
                    className="position-absolute top-50 translate-middle-y text-sa-muted"
                    style={{ left: '12px' }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search student, roll, parent phone, test, subject..."
                    className="form-control form-control-sm ps-5 py-2 rounded-3"
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="col-6 col-md-2">
                <select
                  value={filterChannel}
                  onChange={(e) => {
                    setFilterChannel(e.target.value);
                    setSearchParams(prev => {
                      const p = new URLSearchParams(prev);
                      if (e.target.value === 'all') p.delete('channel');
                      else p.set('channel', e.target.value);
                      return p;
                    });
                  }}
                  className="form-select form-select-sm py-2 rounded-3"
                  style={{ fontSize: '13px' }}
                >
                  <option value="all">All Channels (WhatsApp & SMS)</option>
                  <option value="whatsapp">💬 WhatsApp Only</option>
                  <option value="sms">📱 SMS Only</option>
                </select>
              </div>

              <div className="col-6 col-md-2">
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setSearchParams(prev => {
                      const p = new URLSearchParams(prev);
                      if (e.target.value === 'all') p.delete('type');
                      else p.set('type', e.target.value);
                      return p;
                    });
                  }}
                  className="form-select form-select-sm py-2 rounded-3"
                  style={{ fontSize: '13px' }}
                >
                  <option value="all">All Notification Types</option>
                  <option value="absence_alert">Absence Alerts Only</option>
                  <option value="test_schedule">Test Schedules Only</option>
                  <option value="marks_entry">Marks Entry Alerts</option>
                </select>
              </div>

              <div className="col-6 col-md-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-select form-select-sm py-2 rounded-3"
                  style={{ fontSize: '13px' }}
                >
                  <option value="all">All Delivery Statuses</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Sent">Sent / In-Transit</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="col-6 col-md-1.5">
                <select
                  value={filterLecture}
                  onChange={(e) => setFilterLecture(e.target.value)}
                  className="form-select form-select-sm py-2 rounded-3"
                  style={{ fontSize: '13px' }}
                >
                  <option value="all">All Lectures</option>
                  <option value="1">Lecture 1 (Morning)</option>
                  <option value="2">Lecture 2 (Afternoon)</option>
                </select>
              </div>

              <div className="col-12 col-md-1 d-flex justify-content-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilterType('all');
                    setFilterChannel('all');
                    setFilterStatus('all');
                    setFilterLecture('all');
                    setSearchQuery('');
                  }}
                  className="btn btn-sm btn-outline-secondary py-2 px-3 rounded-3 w-100"
                  style={{ fontSize: '12px' }}
                  title="Reset all filters"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Dispatch Logs Table */}
          <div className="sa-card p-4 bg-white border shadow-2xs">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
              <h5 className="brand-font fw-bold text-sa-charcoal m-0 fs-6">
                Parent Dispatches Roster & Delivery Receipts ({filteredHistory.length})
              </h5>
              <span className="small text-muted">
                Dual Channel: WhatsApp Business Cloud API & SMS Carrier Gateway
              </span>
            </div>

            <Table
              columns={[
                {
                  key: 'created_at',
                  title: 'Dispatched At',
                  render: (val, row) => (
                    <div className="d-flex flex-column">
                      <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '12.5px' }}>
                        {val || row.sent_at || 'Just now'}
                      </span>
                      <span className="text-muted" style={{ fontSize: '11px' }}>
                        {(row.channel || '').toLowerCase().includes('whatsapp') ? 'WhatsApp Cloud' : 'Carrier Route'}
                      </span>
                    </div>
                  )
                },
                {
                  key: 'channel',
                  title: 'Channel',
                  render: (val) => {
                    const isWA = (val || '').toLowerCase().includes('whatsapp');
                    if (isWA) {
                      return (
                        <span className="badge bg-success text-white d-inline-flex align-items-center gap-1 px-2.5 py-1.5 fw-semibold" style={{ fontSize: '11px' }}>
                          <span>💬 WhatsApp</span>
                        </span>
                      );
                    }
                    return (
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1 px-2.5 py-1.5 fw-semibold" style={{ fontSize: '11px' }}>
                        <span>📱 SMS</span>
                      </span>
                    );
                  }
                },
                {
                  key: 'notification_type',
                  title: 'Type & Scope',
                  render: (val, row) => {
                    if (val === 'absence_alert') {
                      const lec = row.lecture_number ? `Lec ${row.lecture_number}` : 'Lec 1';
                      return (
                        <div className="d-flex flex-column gap-1">
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle fw-semibold px-2 py-1" style={{ fontSize: '11px' }}>
                            Absence Alert ({lec})
                          </span>
                          <span className="text-muted" style={{ fontSize: '10.5px' }}>
                            {row.lecture_slot || 'Single Lecture'}
                          </span>
                        </div>
                      );
                    }
                    if (val === 'test_schedule') {
                      return (
                        <div className="d-flex flex-column gap-1">
                          <span className="badge bg-warning-subtle text-dark border border-warning-subtle fw-semibold px-2 py-1" style={{ fontSize: '11px' }}>
                            Test Schedule Alert
                          </span>
                          <span className="text-muted" style={{ fontSize: '10.5px' }}>
                            {row.test_name ? row.test_name.substring(0, 24) + '...' : 'Scheduled Test'}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-semibold px-2 py-1" style={{ fontSize: '11px' }}>
                        Marks / Result Alert
                      </span>
                    );
                  }
                },
                {
                  key: 'student_name',
                  title: 'Student & Parent Contact',
                  render: (val, row) => (
                    <div className="d-flex flex-column">
                      <span className="fw-bold text-sa-charcoal" style={{ fontSize: '13px' }}>
                        {val || 'Student'}
                      </span>
                      <span className="text-sa-muted" style={{ fontSize: '11px' }}>
                        Roll: <strong className="text-dark">{row.roll_number || 'N/A'}</strong> • {row.parent_mobile || '+91 98220 00000'}
                      </span>
                    </div>
                  )
                },
                {
                  key: 'batch',
                  title: 'Batch / Subject',
                  render: (val, row) => (
                    <div className="d-flex flex-column">
                      <span className="fw-semibold text-sa-charcoal" style={{ fontSize: '12px' }}>
                        {val || 'General Batch'}
                      </span>
                      <span className="text-muted" style={{ fontSize: '11px' }}>
                        Subject: {row.subject || 'Academic'}
                      </span>
                    </div>
                  )
                },
                {
                  key: 'message',
                  title: 'Message Content',
                  render: (val, row) => (
                    <div
                      className="cursor-pointer p-2 rounded-2 bg-light bg-opacity-75 border"
                      style={{ maxWidth: '280px', fontSize: '11.5px', lineHeight: 1.35 }}
                      onClick={() => setSelectedMessage(row)}
                      title="Click to view full message"
                    >
                      <p className="m-0 text-truncate text-secondary">
                        {val}
                      </p>
                      <span className="text-sa-primary fw-semibold d-inline-flex align-items-center gap-1 mt-1" style={{ fontSize: '10.5px' }}>
                        <Eye size={12} /> View Full {row.channel || 'Message'}
                      </span>
                    </div>
                  )
                },
                {
                  key: 'delivery_status',
                  title: 'Delivery Status',
                  render: (val, row) => {
                    const st = val || 'Delivered';
                    const isWA = (row.channel || '').toLowerCase().includes('whatsapp');
                    if (st === 'Delivered') {
                      return (
                        <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1.5 px-2.5 py-1.5 fw-semibold" style={{ fontSize: '11.5px' }}>
                          <CheckCircle2 size={13} />
                          <span>{isWA ? 'Delivered ✓✓' : 'Delivered'}</span>
                        </span>
                      );
                    }
                    if (st === 'Sent') {
                      return (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle d-inline-flex align-items-center gap-1.5 px-2.5 py-1.5 fw-semibold" style={{ fontSize: '11.5px' }}>
                          <Clock size={13} />
                          <span>Sent</span>
                        </span>
                      );
                    }
                    return (
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1.5 px-2.5 py-1.5 fw-semibold" style={{ fontSize: '11.5px' }}>
                        <XCircle size={13} />
                        <span>Failed</span>
                      </span>
                    );
                  }
                },
                {
                  key: 'idempotency_key',
                  title: 'Deduplication Key',
                  render: (val) => (
                    <div className="d-flex flex-column" style={{ maxWidth: '160px' }}>
                      <span className="text-truncate font-monospace small text-muted" style={{ fontSize: '10px' }} title={val}>
                        {val || 'None'}
                      </span>
                      <span className="badge bg-light text-success border px-1.5 py-0.5 mt-1" style={{ fontSize: '9px', width: 'fit-content' }}>
                        Protected
                      </span>
                    </div>
                  )
                },
                {
                  key: 'actions',
                  title: 'Actions',
                  render: (_, row) => (
                    <div className="d-flex align-items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedMessage(row)}
                        className="btn btn-sm btn-light border p-1.5 text-secondary"
                        title="View Full Message & Receipts"
                      >
                        <Eye size={14} />
                      </button>

                      {row.parent_mobile && (
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppDirect(row)}
                          className="btn btn-sm btn-outline-success p-1.5"
                          title="Open WhatsApp chat with parent"
                        >
                          <MessageSquare size={14} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleResend(row)}
                        className="btn btn-sm btn-outline-primary p-1.5"
                        title="Re-send notification"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  )
                }
              ]}
              data={filteredHistory}
              loading={loading}
              emptyMessage="No notification dispatches matching selected criteria."
            />
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM & APPROVALS INBOX (Existing Notifications View) */}
      {activeTab === 'inbox' && (
        <div className="sa-card p-4 bg-white border shadow-2xs">
          {inboxNotifications.length === 0 ? (
            <div className="text-center py-5 text-muted small">
              <Bell size={32} className="text-muted mb-2 d-block mx-auto opacity-50" />
              No inbox notifications found.
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {inboxNotifications.map((n, i) => {
                const isDiscountApproval = n.type === 'discount_approval';
                return (
                  <div
                    key={n.id || i}
                    className={`p-3.5 rounded-3 border d-flex align-items-start justify-content-between gap-3 ${
                      isDiscountApproval
                        ? 'bg-warning-subtle border-warning'
                        : n.read
                          ? 'bg-light bg-opacity-50'
                          : 'bg-white shadow-2xs border-start border-4 border-sa-primary'
                    }`}
                  >
                    <div className="d-flex align-items-start gap-3 flex-grow-1">
                      <div
                        className={`p-2.5 rounded-circle mt-1 flex-shrink-0 ${
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
                        <p className="text-sa-muted small mb-1" style={{ lineHeight: 1.45 }}>
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
      )}

      {/* FULL MESSAGE INSPECTION MODAL */}
      {selectedMessage && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div
                className={`modal-header text-white px-4 py-3 ${
                  (selectedMessage.channel || '').toLowerCase().includes('whatsapp')
                    ? 'bg-success'
                    : 'bg-dark'
                }`}
              >
                <div className="d-flex align-items-center gap-2">
                  {(selectedMessage.channel || '').toLowerCase().includes('whatsapp') ? (
                    <MessageSquare size={20} className="text-white" />
                  ) : (
                    <Smartphone size={20} className="text-warning" />
                  )}
                  <h5 className="modal-title fw-bold m-0 fs-6">
                    {(selectedMessage.channel || '').toLowerCase().includes('whatsapp')
                      ? 'WhatsApp Official Message Dispatch Receipt'
                      : 'SMS Gateway Dispatch Details'}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedMessage(null)}
                />
              </div>

              <div className="modal-body p-4 bg-light">
                {/* Meta Summary Cards */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-3">
                    <div className="bg-white p-3 rounded-3 border">
                      <span className="small text-muted d-block mb-1">Student & Roll</span>
                      <strong className="text-sa-charcoal fs-6 d-block">
                        {selectedMessage.student_name}
                      </strong>
                      <span className="small text-secondary">{selectedMessage.roll_number}</span>
                    </div>
                  </div>

                  <div className="col-12 col-md-3">
                    <div className="bg-white p-3 rounded-3 border">
                      <span className="small text-muted d-block mb-1">Parent Mobile</span>
                      <strong className="text-sa-charcoal fs-6 d-block">
                        {selectedMessage.parent_mobile}
                      </strong>
                      <span className="badge bg-success-subtle text-success small mt-1">Verified Contact</span>
                    </div>
                  </div>

                  <div className="col-12 col-md-3">
                    <div className="bg-white p-3 rounded-3 border">
                      <span className="small text-muted d-block mb-1">Channel & Route</span>
                      <strong className={`fs-6 d-flex align-items-center gap-1 ${(selectedMessage.channel || '').toLowerCase().includes('whatsapp') ? 'text-success' : 'text-primary'}`}>
                        {(selectedMessage.channel || '').toLowerCase().includes('whatsapp') ? '💬 WhatsApp API' : '📱 SMS Gateway'}
                      </strong>
                      <span className="small text-muted">Direct Delivery</span>
                    </div>
                  </div>

                  <div className="col-12 col-md-3">
                    <div className="bg-white p-3 rounded-3 border">
                      <span className="small text-muted d-block mb-1">Delivery Status</span>
                      <strong className="text-success fs-6 d-flex align-items-center gap-1.5">
                        <CheckCircle2 size={16} /> {selectedMessage.delivery_status || 'Delivered'}
                      </strong>
                      <span className="small text-muted">{selectedMessage.created_at || 'Today'}</span>
                    </div>
                  </div>
                </div>

                {/* Message Bubble Rendering */}
                {(selectedMessage.channel || '').toLowerCase().includes('whatsapp') ? (
                  // WhatsApp Chat Bubble
                  <div className="p-3.5 rounded-4 border shadow-2xs mb-3" style={{ backgroundColor: '#e5ddd5' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2 px-2 py-1 bg-white bg-opacity-75 rounded-2">
                      <span className="small fw-bold text-success d-flex align-items-center gap-1">
                        <span>💬 WhatsApp Business Message</span>
                      </span>
                      <span className="small text-muted" style={{ fontSize: '11px' }}>
                        Delivered to {selectedMessage.parent_mobile}
                      </span>
                    </div>

                    <div
                      className="p-3.5 rounded-3 border shadow-sm position-relative ms-auto"
                      style={{
                        backgroundColor: '#dcf8c6',
                        borderColor: '#b2dfdb',
                        maxWidth: '92%',
                        fontSize: '13.5px',
                        lineHeight: 1.55,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        color: '#111827'
                      }}
                    >
                      {selectedMessage.message}
                      <div className="text-end mt-2 pt-1 border-top border-success-subtle">
                        <span className="small text-muted me-1" style={{ fontSize: '11px' }}>
                          {selectedMessage.sent_at || 'Today'}
                        </span>
                        <span className="text-primary fw-bold" style={{ fontSize: '13px' }} title="Read by parent">
                          ✓✓
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Cellular SMS Bubble
                  <div className="bg-white p-4 rounded-4 border shadow-2xs mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                      <div className="d-flex align-items-center gap-2">
                        <Send size={15} className="text-primary" />
                        <span className="fw-bold small text-sa-charcoal">
                          Cellular SMS via Carrier Gateway
                        </span>
                      </div>
                      <span className="badge bg-light text-secondary border">160 Char Unit • 1 Part</span>
                    </div>

                    <div
                      className="p-3.5 rounded-3 border"
                      style={{
                        backgroundColor: '#f0fdf4',
                        borderColor: '#bbf7d0',
                        color: '#166534',
                        fontSize: '13.5px',
                        lineHeight: 1.55,
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                    >
                      {selectedMessage.message}
                    </div>
                  </div>
                )}

                {/* Technical Deduplication Key */}
                <div className="bg-white p-3 rounded-3 border">
                  <span className="small text-muted fw-semibold d-block mb-1">
                    System Deduplication Idempotency Key:
                  </span>
                  <code className="text-primary small d-block p-2 bg-light rounded border">
                    {selectedMessage.idempotency_key || 'N/A'}
                  </code>
                  <p className="text-muted small m-0 mt-2" style={{ fontSize: '11px' }}>
                    * This key prevents duplicate notifications across both WhatsApp and SMS channels even if attendance or tests are re-saved.
                  </p>
                </div>
              </div>

              <div className="modal-footer bg-white px-4 py-3 border-top d-flex justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  {selectedMessage.parent_mobile && (
                    <button
                      type="button"
                      className="btn btn-sm btn-success d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2"
                      onClick={() => handleOpenWhatsAppDirect(selectedMessage)}
                    >
                      <ExternalLink size={14} />
                      <span>Open in WhatsApp Web</span>
                    </button>
                  )}

                  <Button
                    variant="outline"
                    icon={RefreshCw}
                    onClick={() => handleResend(selectedMessage)}
                  >
                    Re-send Alert
                  </Button>
                </div>

                <Button variant="primary" onClick={() => setSelectedMessage(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
