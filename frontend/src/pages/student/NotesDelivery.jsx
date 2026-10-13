import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import BackButton from '../../components/common/BackButton';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  Download, 
  FileText, 
  Calendar, 
  UserCheck, 
  Search, 
  BookMarked, 
  Sparkles, 
  AlertCircle,
  Package,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import inventoryService from '../../services/inventoryService';
import notesService from '../../services/notesService';
import { useAuth } from '../../hooks/useAuth';

const DEFAULT_LECTURE_NOTES = [
  {
    id: 'LN-2026-101',
    notesTitle: 'Matrices, Determinants & Differentiation Formula Handbook',
    subject: 'Mathematics',
    teacherName: 'Prof. Shubham Sir',
    date: '2026-03-15',
    summary: 'Comprehensive theorem summaries, matrix inversion shortcuts, and calculus derivatives list.'
  },
  {
    id: 'LN-2026-102',
    notesTitle: 'Rotational Dynamics & Wave Optics Key Derivations',
    subject: 'Physics',
    teacherName: 'Dr. Priya Kulkarni',
    date: '2026-03-22',
    summary: 'Handwritten formulas and essential derivations for rotational motion and Young double slit experiment.'
  },
  {
    id: 'LN-2026-103',
    notesTitle: 'Chemical Thermodynamics & Coordination Compounds Notes',
    subject: 'Chemistry',
    teacherName: 'Prof. Rajesh Patil',
    date: '2026-03-25',
    summary: 'Thermodynamic state functions, enthalpy changes, and IUPAC nomenclature of coordination complexes.'
  },
  {
    id: 'LN-2026-104',
    notesTitle: 'Genetic Inheritance & Molecular Biology Quick Revision',
    subject: 'Biology',
    teacherName: 'Dr. Sneha Deshmukh',
    date: '2026-03-30',
    summary: 'Mendelian ratios, DNA replication steps, and protein synthesis flowcharts.'
  }
];

export default function StudentNotesDelivery() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('books'); // 'books' or 'lectureNotes'
  const [loading, setLoading] = useState(true);

  // Books Delivery Matrix State
  const [deliveryStatus, setDeliveryStatus] = useState({
    theory: {
      Physics: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null, book_title: 'Theory - Physics' },
      Chemistry: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null, book_title: 'Theory - Chemistry' },
      Biology: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null, book_title: 'Theory - Biology' },
      Maths: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null, book_title: 'Theory - Mathematics' }
    },
    cet: {
      Physics: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null, book_title: 'CET - Physics' },
      Chemistry: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null, book_title: 'CET - Chemistry' },
      Biology: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null, book_title: 'CET - Biology' },
      Maths: { delivered: false, status: 'Not Delivered', date: null, handed_over_by: null, book_title: 'CET - Mathematics' }
    },
    deliveries: [],
    summary: { total_books: 8, delivered_count: 0, pending_count: 0, not_delivered_count: 8 }
  });

  // Digital notes download state
  const [lectureNotes, setLectureNotes] = useState(DEFAULT_LECTURE_NOTES);
  const [notesSearch, setNotesSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const studentId = user?.id || 'STU-001';
      // 1. Fetch live books delivery status from database
      try {
        const matrixData = await inventoryService.getStudentDeliveryStatus(studentId);
        if (matrixData) setDeliveryStatus(matrixData);
      } catch (err) {
        // Fallback to my-status
        try {
          const myMatrix = await inventoryService.getMyDeliveryStatus();
          if (myMatrix) setDeliveryStatus(myMatrix);
        } catch {}
      }

      // 2. Fetch teacher uploaded digital notes
      try {
        const liveNotes = await notesService.getForStudent(user || { standard: '12th Science', id: studentId });
        if (liveNotes && Array.isArray(liveNotes) && liveNotes.length > 0) {
          const mapped = liveNotes.map((n, idx) => ({
            id: n.id || `LIVE-${idx}`,
            notesTitle: n.title,
            subject: n.subject || 'General',
            teacherName: n.teacherName || 'Faculty',
            date: n.createdAt ? n.createdAt.split('T')[0] : '2026-03-20',
            summary: n.content
          }));
          setLectureNotes([...mapped, ...DEFAULT_LECTURE_NOTES]);
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDownload = (item) => {
    try {
      const cleanTitle = (item.notesTitle || item.title || 'Notes').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanTitle}_${(item.subject || 'Notes').replace(/\s+/g, '_')}.doc`;

      const content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>${item.notesTitle || item.title}</title>
          <style>
            body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #1f2937; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #8B1216; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 20pt; font-weight: bold; color: #8B1216; margin: 0; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .meta-table td { padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 10pt; }
            .meta-label { font-weight: bold; background-color: #f9fafb; width: 25%; }
            .content-box { background-color: #f8fafc; border-left: 4px solid #8B1216; padding: 12px 16px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">SHUBHAM ACADEMY</div>
            <div>Official Faculty Study Material & Lecture Notes</div>
          </div>
          <table class="meta-table">
            <tr><td class="meta-label">Notes Title:</td><td style="font-weight: bold; color: #8B1216;">${item.notesTitle || item.title}</td></tr>
            <tr><td class="meta-label">Subject:</td><td>${item.subject}</td></tr>
            <tr><td class="meta-label">Teacher:</td><td>${item.teacherName || 'Faculty'}</td></tr>
            <tr><td class="meta-label">Date:</td><td>${item.date}</td></tr>
          </table>
          <div class="content-box">
            ${item.summary || 'Essential lecture notes, key formulas, derivations, and practice questions for student revision.'}
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`"${item.notesTitle || item.title}" downloaded!`);
    } catch (err) {
      toast.error('Failed to download notes file.');
    }
  };

  const deliveredCount = deliveryStatus.summary?.delivered_count || 0;
  const pendingCount = deliveryStatus.summary?.pending_count || 0;
  const notDeliveredCount = deliveryStatus.summary?.not_delivered_count || (8 - deliveredCount - pendingCount);

  return (
    <div className="d-flex flex-column gap-4 pb-4">
      {/* Back button */}
      <div>
        <BackButton to="/student/dashboard" label="Back to Dashboard" />
      </div>

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
        <div>
          <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4 d-flex align-items-center gap-2">
            <Truck className="text-sa-primary" size={24} />
            <span>Books Delivery & Study Material Handover</span>
          </h3>
          <span className="small text-sa-muted">
            Live database verification of Theory and CET books handed over by academy staff
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="d-flex p-1 bg-light rounded-3 border">
          <button
            type="button"
            className={`btn btn-sm px-3 py-1.5 rounded-2 fw-semibold transition-all ${
              activeTab === 'books' ? 'bg-white shadow-xs text-sa-primary' : 'text-sa-muted'
            }`}
            onClick={() => setActiveTab('books')}
          >
            Physical Books ({deliveredCount}/8)
          </button>
          <button
            type="button"
            className={`btn btn-sm px-3 py-1.5 rounded-2 fw-semibold transition-all ${
              activeTab === 'lectureNotes' ? 'bg-white shadow-xs text-sa-primary' : 'text-sa-muted'
            }`}
            onClick={() => setActiveTab('lectureNotes')}
          >
            Digital Notes & Handouts
          </button>
        </div>
      </div>

      {activeTab === 'books' ? (
        <>
          {/* Summary KPI Cards */}
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
                <div>
                  <span className="text-sa-muted fw-semibold small d-block">Curriculum Books Total</span>
                  <div className="fw-bold brand-font text-sa-charcoal fs-3">8 Books</div>
                  <span className="small text-secondary">4 Theory + 4 CET</span>
                </div>
                <div className="rounded-circle p-2.5 bg-primary bg-opacity-10 text-primary">
                  <Package size={24} />
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
                <div>
                  <span className="text-sa-muted fw-semibold small d-block">Delivered to You</span>
                  <div className="fw-bold brand-font fs-3 text-success">{deliveredCount} Books</div>
                  <span className="small text-success fw-medium">Handover confirmed</span>
                </div>
                <div className="rounded-circle p-2.5 bg-success bg-opacity-10 text-success">
                  <CheckCircle2 size={24} />
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
                <div>
                  <span className="text-sa-muted fw-semibold small d-block">Pending Collection</span>
                  <div className="fw-bold brand-font fs-3 text-warning-emphasis">{pendingCount} Books</div>
                  <span className="small text-warning-emphasis fw-medium">Ready at pickup desk</span>
                </div>
                <div className="rounded-circle p-2.5 bg-warning bg-opacity-10 text-warning-emphasis">
                  <Clock size={24} />
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="sa-card p-3 d-flex align-items-center justify-content-between h-100 bg-white border">
                <div>
                  <span className="text-sa-muted fw-semibold small d-block">Remaining Handouts</span>
                  <div className="fw-bold brand-font fs-3 text-danger">{notDeliveredCount} Books</div>
                  <span className="small text-danger fw-medium">Yet to be issued</span>
                </div>
                <div className="rounded-circle p-2.5 bg-danger bg-opacity-10 text-danger">
                  <AlertCircle size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Subject-Wise Books Delivery Grid (Theory & CET) */}
          <div className="row g-3 g-xl-4">
            {/* Theory Books Column */}
            <div className="col-12 col-lg-6">
              <div className="sa-card p-3.5 p-xl-4 bg-white border h-100 d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge px-2.5 py-1 fw-bold rounded-pill text-uppercase" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', fontSize: '0.74rem' }}>
                      Theory Books
                    </span>
                    <h5 className="m-0 fw-bold brand-font text-sa-charcoal fs-6">Board Syllabus Modules</h5>
                  </div>
                  <span className="badge bg-light text-sa-charcoal border small fw-semibold">
                    {Object.values(deliveryStatus.theory || {}).filter(b => b.delivered).length} / 4 Delivered
                  </span>
                </div>

                <div className="d-flex flex-column gap-3 flex-grow-1">
                  {[
                    { name: 'Physics', key: 'Physics' },
                    { name: 'Chemistry', key: 'Chemistry' },
                    { name: 'Biology', key: 'Biology' },
                    { name: 'Mathematics', key: 'Maths' }
                  ].map(({ name, key }) => {
                    const item = deliveryStatus.theory?.[key] || { delivered: false, status: 'Not Delivered' };
                    const isDelivered = item.delivered;
                    const isPending = item.status === 'Pending Pickup';

                    return (
                      <div
                        key={key}
                        className="p-3 rounded-3 border bg-light d-flex flex-column gap-2 transition-all"
                        style={{
                          backgroundColor: isDelivered ? '#F9FDFB' : isPending ? '#FFFDF5' : '#FCFDFE',
                          borderColor: isDelivered ? '#A7F3D0' : isPending ? '#FDE68A' : '#E2E8F0'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle p-2 d-flex align-items-center justify-content-center"
                              style={{
                                backgroundColor: isDelivered ? '#DEF7EC' : isPending ? '#FEF3C7' : '#F1F5F9',
                                color: isDelivered ? '#03543F' : isPending ? '#92400E' : '#64748B'
                              }}
                            >
                              {isDelivered ? <CheckCircle2 size={18} /> : isPending ? <Clock size={18} /> : <BookMarked size={18} />}
                            </div>
                            <div>
                              <span className="fw-bold text-sa-charcoal d-block" style={{ fontSize: '0.92rem' }}>
                                Theory - {name}
                              </span>
                              <span className="text-sa-muted small">Standard Academy Theory Module</span>
                            </div>
                          </div>

                          <div>
                            {isDelivered ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill fw-semibold">
                                ✓ Handed Over
                              </span>
                            ) : isPending ? (
                              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2.5 py-1 rounded-pill fw-semibold">
                                ⏳ Ready for Pickup
                              </span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary px-2.5 py-1 rounded-pill fw-medium">
                                Not Delivered
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Handover Details Footer */}
                        {isDelivered ? (
                          <div className="pt-2 border-top mt-1 d-flex flex-wrap align-items-center justify-content-between text-sa-muted small" style={{ fontSize: '0.74rem' }}>
                            <span>
                              Handed over by: <strong className="text-sa-charcoal">{item.handed_over_by || 'Academy Staff'}</strong>
                            </span>
                            <span>Date: <strong className="text-sa-charcoal">{item.date || '--'}</strong></span>
                          </div>
                        ) : (
                          <div className="pt-1.5 border-top text-sa-muted small" style={{ fontSize: '0.72rem' }}>
                            {isPending ? 'Your book set is packed and waiting at the admin pickup desk.' : 'Please visit the admin counter or contact your academic coordinator.'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CET Books Column */}
            <div className="col-12 col-lg-6">
              <div className="sa-card p-3.5 p-xl-4 bg-white border h-100 d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge px-2.5 py-1 fw-bold rounded-pill text-uppercase" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.74rem' }}>
                      CET Books
                    </span>
                    <h5 className="m-0 fw-bold brand-font text-sa-charcoal fs-6">Entrance Exam Guidebooks</h5>
                  </div>
                  <span className="badge bg-light text-sa-charcoal border small fw-semibold">
                    {Object.values(deliveryStatus.cet || {}).filter(b => b.delivered).length} / 4 Delivered
                  </span>
                </div>

                <div className="d-flex flex-column gap-3 flex-grow-1">
                  {[
                    { name: 'Physics', key: 'Physics' },
                    { name: 'Chemistry', key: 'Chemistry' },
                    { name: 'Biology', key: 'Biology' },
                    { name: 'Mathematics', key: 'Maths' }
                  ].map(({ name, key }) => {
                    const item = deliveryStatus.cet?.[key] || { delivered: false, status: 'Not Delivered' };
                    const isDelivered = item.delivered;
                    const isPending = item.status === 'Pending Pickup';

                    return (
                      <div
                        key={key}
                        className="p-3 rounded-3 border bg-light d-flex flex-column gap-2 transition-all"
                        style={{
                          backgroundColor: isDelivered ? '#F9FDFB' : isPending ? '#FFFDF5' : '#FCFDFE',
                          borderColor: isDelivered ? '#A7F3D0' : isPending ? '#FDE68A' : '#E2E8F0'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle p-2 d-flex align-items-center justify-content-center"
                              style={{
                                backgroundColor: isDelivered ? '#DEF7EC' : isPending ? '#FEF3C7' : '#F1F5F9',
                                color: isDelivered ? '#03543F' : isPending ? '#92400E' : '#64748B'
                              }}
                            >
                              {isDelivered ? <CheckCircle2 size={18} /> : isPending ? <Clock size={18} /> : <Sparkles size={18} />}
                            </div>
                            <div>
                              <span className="fw-bold text-sa-charcoal d-block" style={{ fontSize: '0.92rem' }}>
                                CET - {name}
                              </span>
                              <span className="text-sa-muted small">MHT-CET Competitive Guide</span>
                            </div>
                          </div>

                          <div>
                            {isDelivered ? (
                              <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill fw-semibold">
                                ✓ Handed Over
                              </span>
                            ) : isPending ? (
                              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2.5 py-1 rounded-pill fw-semibold">
                                ⏳ Ready for Pickup
                              </span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary px-2.5 py-1 rounded-pill fw-medium">
                                Not Delivered
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Handover Details Footer */}
                        {isDelivered ? (
                          <div className="pt-2 border-top mt-1 d-flex flex-wrap align-items-center justify-content-between text-sa-muted small" style={{ fontSize: '0.74rem' }}>
                            <span>
                              Handed over by: <strong className="text-sa-charcoal">{item.handed_over_by || 'Academy Staff'}</strong>
                            </span>
                            <span>Date: <strong className="text-sa-charcoal">{item.date || '--'}</strong></span>
                          </div>
                        ) : (
                          <div className="pt-1.5 border-top text-sa-muted small" style={{ fontSize: '0.72rem' }}>
                            {isPending ? 'Your CET guidebook is prepared at the admin pickup desk.' : 'Please visit the admin counter or contact your academic coordinator.'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Official Database Pickup History */}
          <div className="sa-card p-4 bg-white border">
            <h5 className="fw-bold brand-font text-sa-charcoal mb-3 fs-6 d-flex align-items-center gap-2">
              <ShieldCheck size={18} className="text-success" />
              <span>Official Handover Verification Records</span>
            </h5>

            <Table
              columns={[
                {
                  key: 'book_title',
                  title: 'Book Module',
                  render: (val, row) => (
                    <div className="d-flex align-items-center gap-2">
                      <BookMarked size={16} className="text-sa-primary flex-shrink-0" />
                      <span className="fw-bold text-sa-charcoal">{val || row.bookTitle}</span>
                    </div>
                  )
                },
                {
                  key: 'category',
                  title: 'Type',
                  width: '110px',
                  render: (val) => (
                    <span className="badge px-2 py-0.5 rounded-pill bg-light border text-dark fw-semibold">
                      {val || 'Curriculum'}
                    </span>
                  )
                },
                {
                  key: 'subject',
                  title: 'Subject',
                  width: '130px',
                  render: (val) => <span className="fw-semibold text-sa-charcoal">{val || 'General'}</span>
                },
                {
                  key: 'status',
                  title: 'Status',
                  width: '130px',
                  render: (val) => (
                    <span className={val === 'Delivered' ? 'badge-paid' : 'badge-pending'}>
                      {val === 'Delivered' ? <CheckCircle2 size={12} /> : <Clock size={12} />} {val}
                    </span>
                  )
                },
                {
                  key: 'date',
                  title: 'Handover Date & Time',
                  width: '170px',
                  render: (val) => <span className="small text-sa-muted">{val || '--'}</span>
                },
                {
                  key: 'handed_over_by',
                  title: 'Who Handed Them Over',
                  width: '180px',
                  render: (val, row) => (
                    <div className="d-flex align-items-center gap-1.5">
                      <UserCheck size={14} className="text-success" />
                      <span className="fw-semibold text-sa-charcoal small">
                        {val || row.handedOverBy || row.verifiedBy || '--'}
                      </span>
                    </div>
                  )
                }
              ]}
              data={deliveryStatus.deliveries || []}
              loading={loading}
              emptyText="No official physical book handovers recorded yet for your account."
            />
          </div>
        </>
      ) : (
        /* Tab 2: Digital Notes Downloads */
        <div className="d-flex flex-column gap-3">
          <div className="sa-card p-3 bg-white border">
            <div className="position-relative">
              <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-sa-muted" />
              <input
                type="text"
                className="form-control ps-5 py-2 text-sm"
                placeholder="Search downloadable lecture notes, formulas, topics..."
                value={notesSearch}
                onChange={(e) => setNotesSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="sa-card p-4 bg-white border">
            <Table
              columns={[
                {
                  key: 'notesTitle',
                  title: 'Handout / Notes Title',
                  render: (val, row) => (
                    <div className="d-flex align-items-center gap-2">
                      <FileText size={16} className="text-secondary flex-shrink-0" />
                      <span className="fw-semibold text-sa-charcoal">{val || row.title}</span>
                    </div>
                  )
                },
                {
                  key: 'subject',
                  title: 'Subject',
                  width: '140px',
                  render: (val) => <span className="fw-medium text-sa-charcoal">{val}</span>
                },
                {
                  key: 'teacherName',
                  title: 'Faculty',
                  width: '160px',
                  render: (val) => (
                    <div className="d-flex align-items-center gap-1.5">
                      <UserCheck size={14} className="text-success" />
                      <span className="fw-medium text-sa-charcoal small">{val}</span>
                    </div>
                  )
                },
                {
                  key: 'date',
                  title: 'Date',
                  width: '130px',
                  render: (val) => <span className="small text-sa-muted">{val}</span>
                },
                {
                  key: 'download',
                  title: 'Download',
                  align: 'center',
                  width: '130px',
                  render: (_, row) => (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 shadow-xs fw-semibold"
                      onClick={() => handleDownload(row)}
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </button>
                  )
                }
              ]}
              data={lectureNotes.filter(n => !notesSearch || n.notesTitle.toLowerCase().includes(notesSearch.toLowerCase()) || n.subject.toLowerCase().includes(notesSearch.toLowerCase()))}
              emptyText="No digital notes available at this time."
            />
          </div>
        </div>
      )}
    </div>
  );
}
