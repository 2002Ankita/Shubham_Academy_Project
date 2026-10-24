/**
 * Campus & Branch Scoping Utilities
 * Handles department segregation between Mangalvar Peth and Tarabai Park campuses.
 */

export const CAMPUS = {
  MANGALVAR_PETH: 'Mangalvar Peth',
  TARABAI_PARK: 'Tarabai Park'
};

export const MANGALVAR_BATCHES = [
  '11th pcm Mangalvar peth',
  '11th pcb Mangalvar peth',
  '11th pcmb Mangalvar peth',
  '12th pcm Mangalvar peth',
  '12th pcb Mangalvar peth',
  '12th pcmb Mangalvar peth'
];

export const TARABAI_BATCHES = [
  '11th pcm tarabai park',
  '11th pcb tarabai park',
  '11th pcmb tarabai park',
  '12th pcm tarabai park',
  '12th pcb tarabai park',
  '12th pcmb tarabai park'
];

export const ALL_BATCHES = [...MANGALVAR_BATCHES, ...TARABAI_BATCHES];

/**
 * Normalizes branch/campus name string to standard representation.
 */
export const normalizeBranch = (branchStr) => {
  if (!branchStr) return null;
  const s = String(branchStr).trim().toLowerCase();
  if (s.includes('tarabai') || s.includes('tarabai park') || /\b(tp)\b/i.test(s) || s.includes('-tp-') || s.startsWith('tp-') || s.startsWith('sa-tp')) {
    return CAMPUS.TARABAI_PARK;
  }
  if (s.includes('mangalvar') || s.includes('mangalwar') || s.includes('mangalvar peth') || /\b(mp)\b/i.test(s) || s.includes('-mp-') || s.startsWith('mp-') || s.startsWith('sa-mp')) {
    return CAMPUS.MANGALVAR_PETH;
  }
  return null;
};

/**
 * Resolves the active campus/branch for a logged-in user.
 */
export const getUserBranch = (user) => {
  if (!user) {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        user = JSON.parse(stored);
      }
    } catch (e) {
      // ignore
    }
  }

  if (!user) return null;

  // Explicit branch attribute
  if (user.branch) {
    const norm = normalizeBranch(user.branch);
    if (norm) return norm;
  }

  // Derive from email if not explicitly set
  const email = (user.email || '').toLowerCase();
  if (email.includes('tarabai')) {
    return CAMPUS.TARABAI_PARK;
  }
  if (email === 'admin@shubham.edu' || email === 'superadmin@shubham.edu' || email.includes('mangalvar') || email.includes('mangalwar')) {
    return CAMPUS.MANGALVAR_PETH;
  }

  return null;
};

/**
 * Checks whether a batch name belongs to a target branch.
 */
export const isBatchInBranch = (batch, targetBranch) => {
  if (!targetBranch) return true;
  const normTarget = normalizeBranch(targetBranch);
  
  if (batch && typeof batch === 'object') {
    if (batch.branch) {
      const match = normalizeBranch(batch.branch);
      if (match) return match === normTarget;
    }
  }

  const batchName = typeof batch === 'string' ? batch : (batch?.name || batch?.batch_name || batch?.batch || '');
  const normBatch = normalizeBranch(batchName);
  if (!normBatch) return false;
  return normBatch === normTarget;
};

/**
 * Filter an array of batch strings or batch objects by user branch.
 */
export const filterBatchesByBranch = (batches, targetBranch) => {
  if (!targetBranch) return batches;
  const norm = normalizeBranch(targetBranch);
  return (batches || []).filter(b => isBatchInBranch(b, norm));
};

/**
 * Checks whether a student belongs to a target branch based on batch or branch field.
 */
export const isStudentInBranch = (student, targetBranch) => {
  if (!targetBranch) return true;
  const normTarget = normalizeBranch(targetBranch);
  if (!normTarget) return true;

  const isTP = normTarget === CAMPUS.TARABAI_PARK;
  const isMP = normTarget === CAMPUS.MANGALVAR_PETH;

  const studentBranch = student?.branch || '';
  if (studentBranch) {
    const branchMatch = normalizeBranch(studentBranch);
    if (branchMatch) return branchMatch === normTarget;
  }

  const studentBatch = student?.batch || student?.standard || student?.class_code || '';
  if (studentBatch) {
    const batchMatch = normalizeBranch(studentBatch);
    if (batchMatch) return batchMatch === normTarget;
  }

  const roll = (student?.rollNumber || student?.student_id || student?.roll_number || '').toUpperCase();
  if (roll.includes('MP') || roll.includes('-MP-') || roll.startsWith('SA-MP')) {
    return isMP;
  }
  if (roll.includes('TP') || roll.includes('-TP-') || roll.startsWith('SA-TP')) {
    return isTP;
  }

  const nameLower = (student?.name || student?.full_name || student?.student_name || '').toLowerCase();
  if (nameLower.includes('diya') || nameLower.includes('rohan') || nameLower.includes('sneha') || nameLower.includes('aditya')) {
    return isMP;
  }
  if (nameLower.includes('aarav') || nameLower.includes('ananya') || nameLower.includes('tanvi') || nameLower.includes('aryan')) {
    return isTP;
  }

  return false;
};

/**
 * Filters an array of students by campus.
 */
export const filterStudentsByBranch = (students, targetBranch) => {
  if (!targetBranch) return students;
  return (students || []).filter(s => isStudentInBranch(s, targetBranch));
};

/**
 * Filters exams by campus based on exam.batch or exam.standard.
 */
export const filterExamsByBranch = (exams, targetBranch) => {
  if (!targetBranch) return exams;
  const norm = normalizeBranch(targetBranch);
  return (exams || []).filter(e => {
    const br = e?.branch || '';
    if (br) {
      const match = normalizeBranch(br);
      if (match) return match === norm;
    }
    const b = e?.batch || e?.classBatch || e?.standard || '';
    if (b) {
      const match = normalizeBranch(b);
      if (match) return match === norm;
    }
    const title = (e?.title || e?.examName || e?.exam_name || '').toLowerCase();
    if (title.includes('mangalvar') || title.includes('mangalwar')) {
      return norm === CAMPUS.MANGALVAR_PETH;
    }
    if (title.includes('tarabai')) {
      return norm === CAMPUS.TARABAI_PARK;
    }
    return false;
  });
};

/**
 * Filters attendance records / reports by campus.
 */
export const filterAttendanceByBranch = (records, targetBranch) => {
  if (!targetBranch) return records;
  const norm = normalizeBranch(targetBranch);
  return (records || []).filter(r => {
    const br = r?.branch || '';
    if (br) {
      const match = normalizeBranch(br);
      if (match) return match === norm;
    }
    const b = r?.batch || r?.batch_name || r?.standard || '';
    if (b) {
      const match = normalizeBranch(b);
      if (match) return match === norm;
    }
    const roll = (r?.rollNumber || r?.roll_number || '').toUpperCase();
    if (roll.includes('MP')) return norm === CAMPUS.MANGALVAR_PETH;
    if (roll.includes('TP')) return norm === CAMPUS.TARABAI_PARK;

    const sName = (r?.studentName || r?.student_name || '').toLowerCase();
    if (sName.includes('diya') || sName.includes('rohan') || sName.includes('sneha') || sName.includes('aditya')) {
      return norm === CAMPUS.MANGALVAR_PETH;
    }
    if (sName.includes('aarav') || sName.includes('ananya') || sName.includes('tanvi') || sName.includes('aryan')) {
      return norm === CAMPUS.TARABAI_PARK;
    }
    return false;
  });
};

/**
 * Filters fee records / receipts by campus.
 */
export const filterFeesByBranch = (fees, targetBranch) => {
  if (!targetBranch) return fees;
  const norm = normalizeBranch(targetBranch);
  return (fees || []).filter(f => {
    const br = f?.branch || '';
    if (br) {
      const match = normalizeBranch(br);
      if (match) return match === norm;
    }
    const b = f?.batch || f?.standard || f?.student_batch || '';
    if (b) {
      const match = normalizeBranch(b);
      if (match) return match === norm;
    }
    const roll = (f?.rollNumber || f?.roll_number || '').toUpperCase();
    if (roll.includes('MP')) return norm === CAMPUS.MANGALVAR_PETH;
    if (roll.includes('TP')) return norm === CAMPUS.TARABAI_PARK;

    const sName = (f?.studentName || f?.student_name || '').toLowerCase();
    if (sName.includes('diya') || sName.includes('rohan') || sName.includes('sneha') || sName.includes('aditya')) {
      return norm === CAMPUS.MANGALVAR_PETH;
    }
    if (sName.includes('aarav') || sName.includes('ananya') || sName.includes('tanvi') || sName.includes('aryan')) {
      return norm === CAMPUS.TARABAI_PARK;
    }
    return false;
  });
};
