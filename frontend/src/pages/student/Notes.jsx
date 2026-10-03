import React, { useState, useEffect } from 'react';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../hooks/useAuth';
import notesService from '../../services/notesService';
import {
  StickyNote,
  Paperclip,
  Download,
  Eye,
  Search,
  User,
  Calendar,
  BookOpen,
  FileText,
  Clock
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function StudentNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchStudentNotes = async () => {
      try {
        setLoading(true);
        // Pass logged-in student info to get relevant notes
        const data = await notesService.getForStudent(user || { standard: '12th Science', id: 'STU-001' });
        setNotes(data);
      } catch (err) {
        console.error('Failed to load student notes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentNotes();
  }, [user]);

  const handleOpenNote = (note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const handleDownloadAttachment = (attachment, noteTitle) => {
    if (attachment?.dataUrl) {
      const link = document.createElement('a');
      link.href = attachment.dataUrl;
      link.download = attachment.name || `${noteTitle}_attachment.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded "${attachment.name}"`);
    } else {
      toast.info(`Downloading attachment "${attachment?.name || 'file'}"...`);
    }
  };

  const filteredNotes = notes.filter(n => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      (n.teacherName && n.teacherName.toLowerCase().includes(q)) ||
      (n.subject && n.subject.toLowerCase().includes(q))
    );
  });

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. Header */}
      <div>
        <h3 className="brand-font fw-extrabold text-sa-charcoal m-0 fs-4">
          Teacher Notes & Messages
        </h3>
        <span className="small text-sa-muted">
          Read personalized study advice, derivations, and notifications sent directly by your faculty
        </span>
      </div>

      {/* 2. Search Bar */}
      <div className="sa-card p-3">
        <div className="position-relative">
          <Search
            size={16}
            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-sa-muted"
          />
          <input
            type="text"
            className="form-control ps-5 py-2 text-sm"
            placeholder="Search notes by title, teacher, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Notes Table */}
      <div className="sa-card p-4">
        <Table
          columns={[
            {
              key: 'title',
              title: 'Note Title & Content',
              render: (val, row) => (
                <div className="d-flex align-items-start gap-2.5 py-1">
                  <div
                    className="p-2 rounded bg-light border text-sa-primary flex-shrink-0 mt-0.5"
                    style={{ color: 'var(--sa-primary-red)' }}
                  >
                    <StickyNote size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="fw-semibold text-sa-charcoal d-block lh-sm">{val}</span>
                    <span
                      className="text-sa-muted text-xs d-block mt-1 text-truncate"
                      style={{ maxWidth: '340px' }}
                      title={row.content}
                    >
                      {row.content}
                    </span>
                    {row.attachment && (
                      <span className="badge bg-light text-sa-muted border border-secondary border-opacity-25 mt-1 d-inline-flex align-items-center gap-1 py-0.5 px-2 text-xs">
                        <Paperclip size={11} />
                        <span className="text-truncate" style={{ maxWidth: '140px' }}>
                          {row.attachment.name}
                        </span>
                        <span>({row.attachment.size})</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            },
            {
              key: 'teacherName',
              title: 'Faculty / Teacher',
              render: (val, row) => (
                <div>
                  <span className="small fw-semibold text-sa-charcoal d-block">{val}</span>
                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-0.5 text-xs mt-0.5">
                    {row.subject || 'Faculty'}
                  </span>
                </div>
              )
            },
            {
              key: 'createdAt',
              title: 'Date & Time',
              render: (val) => (
                <span className="small text-sa-muted d-block">{val}</span>
              )
            },
            {
              key: 'id',
              title: 'Actions',
              align: 'end',
              render: (val, row) => (
                <div className="d-flex align-items-center justify-content-end gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Eye}
                    onClick={() => handleOpenNote(row)}
                  >
                    Read
                  </Button>
                  {row.attachment && (
                    <Button
                      size="sm"
                      variant="light"
                      icon={Download}
                      onClick={() => handleDownloadAttachment(row.attachment, row.title)}
                      title="Download Attachment"
                    >
                      Download
                    </Button>
                  )}
                </div>
              )
            }
          ]}
          data={filteredNotes}
          emptyText="No notes received from teachers at this time."
        />
      </div>

      {/* 4. Read Note Modal */}
      {selectedNote && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Teacher Note"
          size="md"
        >
          <div className="d-flex flex-column gap-3">
            <div>
              <div className="d-flex align-items-center justify-content-between text-xs text-sa-muted mb-1">
                <span>{selectedNote.createdAt}</span>
                <span className="badge bg-light text-sa-charcoal border">
                  {selectedNote.recipientType === 'Student' ? 'Direct Note' : selectedNote.targetClass}
                </span>
              </div>
              <h5 className="brand-font fw-bold text-sa-charcoal m-0">{selectedNote.title}</h5>
            </div>

            {/* Teacher Details Box */}
            <div className="p-3 rounded-3 bg-light border text-xs d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle p-1.5 text-white d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: 'var(--sa-primary-red)', width: '32px', height: '32px' }}
                >
                  <User size={16} />
                </div>
                <div>
                  <div className="fw-bold text-sa-charcoal">{selectedNote.teacherName}</div>
                  <div className="text-sa-muted">{selectedNote.subject} Faculty</div>
                </div>
              </div>
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                Verified Faculty Note
              </span>
            </div>

            {/* Note Content */}
            <div>
              <div className="text-sa-muted small fw-semibold mb-1">Note Content:</div>
              <div
                className="p-3 rounded-3 border bg-white text-sa-charcoal text-sm"
                style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
              >
                {selectedNote.content}
              </div>
            </div>

            {/* Attachment Box */}
            {selectedNote.attachment && (
              <div>
                <div className="text-sa-muted small fw-semibold mb-1">Attached Document:</div>
                <div className="d-flex align-items-center justify-content-between p-2.5 rounded-3 border bg-light">
                  <div className="d-flex align-items-center gap-2 min-w-0">
                    <Paperclip size={16} className="text-primary flex-shrink-0" />
                    <span className="text-sm fw-medium text-sa-charcoal text-truncate">
                      {selectedNote.attachment.name} ({selectedNote.attachment.size})
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Download}
                    onClick={() => handleDownloadAttachment(selectedNote.attachment, selectedNote.title)}
                  >
                    Download
                  </Button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="d-flex justify-content-end pt-3 border-top">
              <Button variant="light" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
