/**
 * Centralized Branch, Batch, and Session Configuration for Shubham Academy.
 * 
 * Flow:
 * - Tarabai Park: Direct Academic Batch selection (11th PCM, 11th PCB, 11th PCMB, 12th PCM, 12th PCB, 12th PCMB)
 * - Mangalwar Peth: Session (Morning, Afternoon) -> Academic Batch selection (11th PCM, 11th PCB, 11th PCMB, 12th PCM, 12th PCB, 12th PCMB)
 */

export const BRANCH_TARABAI = 'Tarabai Park';
export const BRANCH_MANGALWAR = 'Mangalwar Peth';

export const BRANCHES = [
  BRANCH_TARABAI,
  BRANCH_MANGALWAR
];

export const SESSIONS = [
  'Morning',
  'Afternoon'
];

export const ACADEMIC_BATCHES = [
  '11th PCM',
  '11th PCB',
  '11th PCMB',
  '12th PCM',
  '12th PCB',
  '12th PCMB'
];

/**
 * Returns whether session selection (Morning/Afternoon) is required for a branch.
 */
export const isSessionRequired = (branch) => {
  if (!branch) return false;
  const b = String(branch).toLowerCase().trim();
  return b.includes('mangal');
};

/**
 * Returns available academic batches for the selected branch and session.
 */
export const getBatchesForBranch = (branch, session = null) => {
  if (!branch) return [];
  // For both Tarabai Park and Mangalwar Peth, all 6 academic batches are available
  return [...ACADEMIC_BATCHES];
};

/**
 * Normalizes branch string into either 'Tarabai Park' or 'Mangalwar Peth'.
 */
export const normalizeBranch = (rawBranch) => {
  if (!rawBranch) return null;
  const b = String(rawBranch).toLowerCase().trim();
  if (b.includes('tarabai') || b.includes('main') || b.includes('kolhapur')) {
    return BRANCH_TARABAI;
  }
  if (b.includes('mangal')) {
    return BRANCH_MANGALWAR;
  }
  return rawBranch.trim();
};

/**
 * Normalizes an academic batch string into one of the 6 standardized batches.
 */
export const normalizeAcademicBatch = (rawBatch) => {
  if (!rawBatch) return null;
  const b = String(rawBatch).toLowerCase().trim();

  const is12th = b.includes('12');
  const std = is12th ? '12th' : '11th';

  let stream = 'PCM';
  if (b.includes('pcmb') || (b.includes('math') && b.includes('bio'))) {
    stream = 'PCMB';
  } else if (b.includes('pcb') || b.includes('bio')) {
    stream = 'PCB';
  } else if (b.includes('pcm') || b.includes('math')) {
    stream = 'PCM';
  }

  return `${std} ${stream}`;
};

/**
 * Normalizes session into 'Morning' or 'Afternoon'.
 */
export const normalizeSession = (rawSession) => {
  if (!rawSession) return null;
  const s = String(rawSession).toLowerCase().trim();
  if (s.includes('afternoon') || s.includes('pm') || s.includes('noon')) {
    return 'Afternoon';
  }
  if (s.includes('morning') || s.includes('am')) {
    return 'Morning';
  }
  return null;
};

/**
 * Extract clean student assignment info from a student object.
 */
export const getStudentAssignment = (student) => {
  if (!student) {
    return { branch: BRANCH_TARABAI, academicBatch: '11th PCM', session: null, standard: '11th Science' };
  }

  const rawBranch = student.branch;
  const rawBatch = student.academic_batch || student.academicBatch || student.batch;
  const rawSession = student.session;

  const branch = normalizeBranch(rawBranch) || (rawBatch && String(rawBatch).toLowerCase().includes('mangal') ? BRANCH_MANGALWAR : BRANCH_TARABAI);
  const academicBatch = normalizeAcademicBatch(rawBatch) || '11th PCM';

  let session = normalizeSession(rawSession);
  if (branch === BRANCH_MANGALWAR && !session) {
    session = rawBatch && String(rawBatch).toLowerCase().includes('afternoon') ? 'Afternoon' : 'Morning';
  } else if (branch === BRANCH_TARABAI) {
    session = null;
  }

  const standard = academicBatch.startsWith('12th') ? '12th Science' : '11th Science';

  return { branch, academicBatch, session, standard };
};

/**
 * Format a human-readable badge/label for a student's batch assignment.
 */
export const formatStudentBatchDisplay = (student) => {
  const { branch, academicBatch, session } = getStudentAssignment(student);
  if (branch === BRANCH_MANGALWAR && session) {
    return `${branch} • ${session} • ${academicBatch}`;
  }
  return `${branch} • ${academicBatch}`;
};

/**
 * Client-side filter to verify if a student matches selected branch, academic batch, and session.
 */
export const matchesStudentFilters = (student, filters = {}) => {
  if (!student) return false;
  const { branch: filterBranch, academicBatch: filterBatch, session: filterSession, search } = filters;

  const { branch: sBranch, academicBatch: sBatch, session: sSession } = getStudentAssignment(student);

  // 1. Branch filter
  if (filterBranch && filterBranch !== 'All' && filterBranch !== 'ALL') {
    const normReqBranch = normalizeBranch(filterBranch);
    if (normReqBranch && normReqBranch !== sBranch) {
      return false;
    }
  }

  // 2. Session filter
  if (filterSession && filterSession !== 'All' && filterSession !== 'ALL') {
    const normReqSession = normalizeSession(filterSession);
    if (normReqSession) {
      if (sBranch !== BRANCH_MANGALWAR) return false;
      if (sSession !== normReqSession) return false;
    }
  }

  // 3. Academic Batch filter
  if (filterBatch && filterBatch !== 'All' && filterBatch !== 'ALL') {
    const normReqBatch = normalizeAcademicBatch(filterBatch);
    if (normReqBatch && normReqBatch !== sBatch) {
      return false;
    }
  }

  // 4. Search query
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    const name = String(student.name || student.full_name || '').toLowerCase();
    const roll = String(student.rollNumber || student.student_id || student.roll_number || '').toLowerCase();
    const phone = String(student.phone || student.mobile_number || '').toLowerCase();
    if (!name.includes(q) && !roll.includes(q) && !phone.includes(q)) {
      return false;
    }
  }

  return true;
};
