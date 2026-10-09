import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import { Download, FileText, Calendar, UserCheck, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import notesService from '../../services/notesService';
import { useAuth } from '../../hooks/useAuth';

const DEFAULT_DELIVERIES = [
  {
    id: 'ND-2026-101',
    notesTitle: 'Matrices, Determinants & Differentiation Formula Handbook',
    subject: 'Mathematics - I',
    teacherName: 'Prof. Shubham Sir',
    date: '2026-03-15',
    summary: 'Comprehensive theorem summaries, matrix inversion shortcuts, and calculus derivatives list.'
  },
  {
    id: 'ND-2026-102',
    notesTitle: 'Definite Integration, Differential Equations & Vectors Guide',
    subject: 'Mathematics - II',
    teacherName: 'Prof. Shubham Sir',
    date: '2026-03-18',
    summary: 'Step-by-step methods for integration by parts, partial fractions, and differential equations.'
  },
  {
    id: 'ND-2026-103',
    notesTitle: 'Rotational Dynamics & Wave Optics Key Derivations',
    subject: 'Physics',
    teacherName: 'Dr. Priya Kulkarni',
    date: '2026-03-22',
    summary: 'Handwritten formulas and essential derivations for rotational motion and Young double slit experiment.'
  },
  {
    id: 'ND-2026-104',
    notesTitle: 'Chemical Thermodynamics & Coordination Compounds Notes',
    subject: 'Chemistry',
    teacherName: 'Prof. Rajesh Patil',
    date: '2026-03-25',
    summary: 'Thermodynamic state functions, enthalpy changes, and IUPAC nomenclature of coordination complexes.'
  },
  {
    id: 'ND-2026-105',
    notesTitle: 'Mathematical Logic & Trigonometric Functions Short Tricks',
    subject: 'Mathematics - I',
    teacherName: 'Prof. Aniket Kadam',
    date: '2026-03-28',
    summary: 'Truth tables, logical equivalences, and principal value branches of inverse trigonometric functions.'
  },
  {
    id: 'ND-2026-106',
    notesTitle: 'Genetic Inheritance & Molecular Biology Quick Revision',
    subject: 'Biology',
    teacherName: 'Dr. Sneha Deshmukh',
    date: '2026-03-30',
    summary: 'Mendelian ratios, DNA replication steps, and protein synthesis flowcharts.'
  }
];

const formatToYMD = (dateStr) => {
  if (!dateStr) return '2026-03-15';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return dateStr;
};

export default function StudentNotesDelivery() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState(DEFAULT_DELIVERIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const liveNotes = await notesService.getForStudent(user || { standard: '12th Science', id: 'STU-001' });
        if (liveNotes && Array.isArray(liveNotes) && liveNotes.length > 0) {
          const liveMapped = liveNotes.map((n, idx) => ({
            id: n.id || `LIVE-${idx}`,
            notesTitle: n.title,
            subject: n.subject || 'Mathematics - I',
            teacherName: n.teacherName || 'Prof. Shubham Sir',
            date: n.createdAt ? formatToYMD(n.createdAt) : formatToYMD(new Date()),
            summary: n.content
          }));
          // Combine live notes with default deliveries
          setDeliveries([...liveMapped, ...DEFAULT_DELIVERIES]);
        } else {
          setDeliveries(DEFAULT_DELIVERIES);
        }
      } catch (e) {
        setDeliveries(DEFAULT_DELIVERIES);
      }
    };
    loadNotes();
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
            .subtitle { font-size: 11pt; color: #6b7280; margin-top: 4px; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .meta-table td { padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 10pt; }
            .meta-label { font-weight: bold; background-color: #f9fafb; width: 25%; }
            .section-title { font-size: 13pt; font-weight: bold; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 20px; }
            .content-box { background-color: #f8fafc; border-left: 4px solid #8B1216; padding: 12px 16px; margin: 15px 0; font-size: 11pt; }
            ul { margin-top: 6px; padding-left: 20px; }
            li { margin-bottom: 6px; }
            .footer { margin-top: 40px; text-align: center; font-size: 9pt; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">SHUBHAM ACADEMY</div>
            <div class="subtitle">Official Faculty Study Material & Notes Delivery</div>
          </div>

          <table class="meta-table">
            <tr>
              <td class="meta-label">Notes Title:</td>
              <td style="font-weight: bold; color: #8B1216;">${item.notesTitle || item.title}</td>
            </tr>
            <tr>
              <td class="meta-label">Subject:</td>
              <td>${item.subject}</td>
            </tr>
            <tr>
              <td class="meta-label">Teacher Name:</td>
              <td>${item.teacherName || item.teacher || 'Faculty'}</td>
            </tr>
            <tr>
              <td class="meta-label">Date:</td>
              <td>${item.date}</td>
            </tr>
          </table>

          <div class="section-title">Overview & Notes Summary</div>
          <div class="content-box">
            ${item.summary || 'Essential lecture notes, key formulas, derivations, and practice questions for student revision.'}
          </div>

          <div class="section-title">Syllabus Coverage & Important Topics</div>
          <ul>
            <li><strong>Core Concepts:</strong> Detailed mathematical and conceptual explanations.</li>
            <li><strong>Essential Formulae:</strong> Step-by-step derivations and sign conventions.</li>
            <li><strong>Board Pattern Questions:</strong> Selected examination problems with model solutions.</li>
            <li><strong>Practice Exercises:</strong> Self-assessment exercises for competitive preparation.</li>
          </ul>

          <div class="footer">
            Shubham Academy &bull; Education Builds Brighter Future &bull; For Student Use Only
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

      toast.success(`"${item.notesTitle || item.title}" downloaded successfully!`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download notes file.');
    }
  };

  const filteredDeliveries = deliveries.filter(item => {
    const matchesSubject = selectedSubject === 'All' || item.subject === selectedSubject;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesSubject;
    const matchesSearch =
      (item.notesTitle && item.notesTitle.toLowerCase().includes(q)) ||
      (item.subject && item.subject.toLowerCase().includes(q)) ||
      (item.teacherName && item.teacherName.toLowerCase().includes(q));
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. Header */}
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Notes Delivery
        </h3>
        <span className="small text-sa-muted">
          Access and download teacher-delivered lecture notes and study material
        </span>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="sa-card p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-7 position-relative">
            <Search
              size={16}
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-sa-muted"
            />
            <input
              type="text"
              className="form-control ps-5 py-2 text-sm"
              placeholder="Search by notes title, subject, or teacher name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-5 d-flex justify-content-md-end align-items-center gap-2">
            <select
              className="form-select form-select-sm shadow-xs w-100 w-md-auto"
              style={{
                minWidth: '180px',
                paddingRight: '2.5rem',
                cursor: 'pointer',
                fontWeight: 500
              }}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="All">All Subjects</option>
              <option value="Mathematics - I">Mathematics - I</option>
              <option value="Mathematics - II">Mathematics - II</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Notes Delivery Table: Clean headers with Notes Title, Subject, Teacher Name, Date, Download */}
      <div className="sa-card p-4">
        <Table
          columns={[
            {
              key: 'notesTitle',
              title: 'Notes Title',
              render: (val, row) => (
                <div className="d-flex align-items-center gap-2">
                  <FileText size={16} className="text-secondary flex-shrink-0" />
                  <span className="fw-semibold text-sa-charcoal">
                    {val || row.title}
                  </span>
                </div>
              )
            },
            {
              key: 'subject',
              title: 'Subject',
              width: '140px',
              render: (val) => (
                <span className="fw-medium text-sa-charcoal text-nowrap" style={{ whiteSpace: 'nowrap' }}>
                  {val || 'N/A'}
                </span>
              )
            },
            {
              key: 'teacherName',
              title: 'Teacher Name',
              width: '160px',
              render: (val, row) => (
                <div className="d-flex align-items-center gap-1.5 text-nowrap" style={{ whiteSpace: 'nowrap' }}>
                  <UserCheck size={14} className="text-success flex-shrink-0" />
                  <span className="fw-medium text-sa-charcoal small text-nowrap" style={{ whiteSpace: 'nowrap' }}>
                    {val || row.teacher || 'Faculty'}
                  </span>
                </div>
              )
            },
            {
              key: 'date',
              title: 'Date',
              width: '140px',
              render: (val) => (
                <div
                  className="d-inline-flex align-items-center gap-1 px-2 py-1 bg-light border rounded small text-dark fw-medium text-nowrap"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Calendar size={13} className="text-secondary flex-shrink-0" />
                  <span className="text-nowrap" style={{ whiteSpace: 'nowrap' }}>
                    {formatToYMD(val)}
                  </span>
                </div>
              )
            },
            {
              key: 'download',
              title: 'Download',
              align: 'center',
              width: '130px',
              render: (_, row) => (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 shadow-xs fw-semibold text-nowrap"
                  style={{ whiteSpace: 'nowrap' }}
                  onClick={() => handleDownload(row)}
                  title={`Download ${row.notesTitle || row.title}`}
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              )
            }
          ]}
          data={filteredDeliveries}
          emptyText="No notes delivered at this time."
        />
      </div>
    </div>
  );
}
