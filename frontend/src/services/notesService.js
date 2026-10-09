const STORAGE_KEY = 'shubham_academy_teacher_notes';

const INITIAL_NOTES = [
  {
    id: 'NOTE-2026-001',
    title: 'Ray Optics Formula Sheet & Sign Conventions',
    content: 'Please review these standard Cartesian sign convention rules and lens-maker formula derivations before tomorrow\'s numerical problem-solving session. Bring your queries to the 9:00 AM slot.',
    recipientType: 'Class',
    targetClass: '12th Science - Alpha',
    studentId: null,
    studentName: null,
    teacherId: 'usr_003',
    teacherName: 'Dr. Priya Kulkarni',
    subject: 'Physics',
    status: 'Sent',
    createdAt: '24 Sep 2026, 10:15 AM',
    updatedAt: '24 Sep 2026, 10:15 AM',
    attachment: {
      name: 'Ray_Optics_Summary.pdf',
      size: '2.1 MB',
      type: 'application/pdf',
      dataUrl: null
    }
  },
  {
    id: 'NOTE-2026-002',
    title: 'Thermodynamics Unit 4 Practice Set & Hints',
    content: 'Attached are 15 solved problems and 10 self-practice questions on Carnot Engine efficiency and Second Law of Thermodynamics. Complete problems 1 through 5 by Monday.',
    recipientType: 'Class',
    targetClass: '11th Science - Beta',
    studentId: null,
    studentName: null,
    teacherId: 'usr_003',
    teacherName: 'Dr. Priya Kulkarni',
    subject: 'Physics',
    status: 'Sent',
    createdAt: '22 Sep 2026, 02:40 PM',
    updatedAt: '22 Sep 2026, 02:40 PM',
    attachment: {
      name: 'Thermodynamics_Problems_Set.pdf',
      size: '3.5 MB',
      type: 'application/pdf',
      dataUrl: null
    }
  },
  {
    id: 'NOTE-2026-003',
    title: 'Wave Theory Derivations - Personal Revision Advice',
    content: 'Aarav, your step in the Young\'s double-slit path difference calculation needs more precision in the binomial expansion approximation. Please check the attached handwritten step guide.',
    recipientType: 'Student',
    targetClass: '12th Science - Alpha',
    studentId: 'STU-001',
    studentName: 'Aarav Deshmukh',
    teacherId: 'usr_003',
    teacherName: 'Dr. Priya Kulkarni',
    subject: 'Physics',
    status: 'Sent',
    createdAt: '25 Sep 2026, 04:20 PM',
    updatedAt: '25 Sep 2026, 04:20 PM',
    attachment: {
      name: 'Derivation_Correction_Note.pdf',
      size: '1.2 MB',
      type: 'application/pdf',
      dataUrl: null
    }
  },
  {
    id: 'NOTE-2026-004',
    title: 'Upcoming Practical Viva Guidelines & Checklist',
    content: 'Draft notes outlining the essential prism dispersion experiment viva questions and potentiometer calibration checklist.',
    recipientType: 'Class',
    targetClass: '12th Science - Alpha',
    studentId: null,
    studentName: null,
    teacherId: 'usr_003',
    teacherName: 'Dr. Priya Kulkarni',
    subject: 'Physics',
    status: 'Draft',
    createdAt: '26 Sep 2026, 09:00 AM',
    updatedAt: '26 Sep 2026, 09:00 AM',
    attachment: null
  }
];

const getStoredNotes = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTES));
      return INITIAL_NOTES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_NOTES;
  } catch (err) {
    console.warn('Error reading notes from localStorage:', err);
    return INITIAL_NOTES;
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
