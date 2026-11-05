const STORAGE_KEY = 'shubham_academy_teacher_notes';

const INITIAL_NOTES = [];

const getStoredNotes = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Purge any legacy hardcoded mock notes
      const filtered = parsed.filter(n => !n.id?.startsWith('NOTE-2026-00'));
      if (filtered.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
      return filtered;
    }
    return [];
  } catch (err) {
    console.warn('Error reading notes from localStorage:', err);
    return [];
  }
};

const saveStoredNotes = (notes) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.warn('Error saving notes to localStorage:', err);
  }
};

export const notesService = {
  /**
   * Get all notes with optional filtering
   */
  getAll: async (params = {}) => {
    let notes = getStoredNotes();

    // Filter by teacherId (authorization check)
    if (params.teacherId) {
      notes = notes.filter(n => n.teacherId === params.teacherId);
    }

    // Filter by status (Sent / Draft)
    if (params.status && params.status !== 'All') {
      notes = notes.filter(n => n.status.toLowerCase() === params.status.toLowerCase());
    }

    // Filter by target class
    if (params.targetClass && params.targetClass !== 'All') {
      notes = notes.filter(n => n.targetClass === params.targetClass || n.targetClass === 'All Classes');
    }

    // Filter by search query
    if (params.search) {
      const q = params.search.toLowerCase();
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.targetClass && n.targetClass.toLowerCase().includes(q)) ||
        (n.studentName && n.studentName.toLowerCase().includes(q))
      );
    }

    return notes;
  },

  /**
   * Get single note by id
   */
  getById: async (id) => {
    const notes = getStoredNotes();
    return notes.find(n => n.id === id) || null;
  },

  /**
   * Get notes intended for a student
   */
  getForStudent: async (student) => {
    const notes = getStoredNotes();
    const studentStandard = student?.standard || (student?.title && student.title.includes('12th') ? '12th Science' : '12th Science');
    const studentId = student?.id || 'STU-001';
    const studentName = student?.name ? student.name.toLowerCase() : 'aarav deshmukh';

    // Only return notes that are "Sent" and directed to the student's class or the student specifically
    return notes.filter(n => {
      if (n.status !== 'Sent') return false;
      if (n.recipientType === 'Student') {
        if (n.studentId === studentId) return true;
        if (studentId === 'usr_004' && (n.studentId === 'STU-001' || (n.studentName && n.studentName.toLowerCase().includes('aarav')))) return true;
        if (n.studentName && n.studentName.toLowerCase() === studentName) return true;
      }
      if (n.recipientType === 'Class') {
        if (n.targetClass === 'All Classes') return true;
        if (n.targetClass && n.targetClass.includes(studentStandard)) return true;
        if (studentStandard && studentStandard.includes(n.targetClass)) return true;
      }
      return false;
    });
  },

  /**
   * Create a new note
   */
  create: async (data) => {
    const notes = getStoredNotes();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const newNote = {
      id: `NOTE-${now.getFullYear()}-${String(notes.length + 1).padStart(3, '0')}`,
      title: data.title?.trim() || 'Untitled Note',
      content: data.content?.trim() || '',
      recipientType: data.recipientType || 'Class',
      targetClass: data.targetClass || '12th Science - Alpha',
      studentId: data.studentId || null,
      studentName: data.studentName || null,
      teacherId: data.teacherId || 'usr_003',
      teacherName: data.teacherName || 'Dr. Priya Kulkarni',
      subject: data.subject || 'Physics',
      status: data.status || 'Sent', // 'Sent' or 'Draft'
      createdAt: formattedDate,
      updatedAt: formattedDate,
      attachment: data.attachment || null
    };

    const updated = [newNote, ...notes];
    saveStoredNotes(updated);
    return newNote;
  },

  /**
   * Update an existing note
   */
  update: async (id, data) => {
    const notes = getStoredNotes();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) {
      throw new Error(`Note ${id} not found`);
    }

    const updatedNote = {
      ...notes[idx],
      ...data,
      updatedAt: formattedDate
    };

    notes[idx] = updatedNote;
    saveStoredNotes(notes);
    return updatedNote;
  },

  /**
   * Delete a note
   */
  delete: async (id) => {
    const notes = getStoredNotes();
    const updated = notes.filter(n => n.id !== id);
    saveStoredNotes(updated);
    return { success: true };
  }
};

export default notesService;
