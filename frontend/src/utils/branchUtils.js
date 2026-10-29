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
  if (s === 'all' || s === 'all branches') return null;
  if (s.includes('tarabai') || s.includes('tarabai park') || /\b(tp)\b/i.test(s) || s.includes('-tp-') || s.startsWith('tp-') || s.startsWith('sa-tp')) {
    return CAMPUS.TARABAI_PARK;
  }
  if (s.includes('mangalvar') || s.includes('mangalwar') || s.includes('manglavar') || s.includes('mangalvar peth') || /\b(mp)\b/i.test(s) || s.includes('-mp-') || s.startsWith('mp-') || s.startsWith('sa-mp')) {
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
 * Checks whether the logged-in user is a SuperAdmin.
 */
export const isSuperAdminUser = (user) => {
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
  const role = (user?.role || '').toLowerCase();
  return role.includes('super');
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
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return batches;
  const norm = normalizeBranch(targetBranch);
  if (!norm) return batches;
  return (batches || []).filter(b => isBatchInBranch(b, norm));
};

/**
 * Checks whether a student belongs to a target branch based on batch or branch field.
 */
export const isStudentInBranch = (student, targetBranch) => {
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return true;
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

  return false;
};

/**
 * Filters an array of students by campus.
 */
export const filterStudentsByBranch = (students, targetBranch) => {
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return students;
  return (students || []).filter(s => isStudentInBranch(s, targetBranch));
};

/**
 * Filters exams by campus based on exam.batch or exam.standard.
 */
export const filterExamsByBranch = (exams, targetBranch) => {
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return exams;
  const norm = normalizeBranch(targetBranch);
  if (!norm) return exams;
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
    if (title.includes('mangalvar') || title.includes('mangalwar') || title.includes('manglavar')) {
      return norm === CAMPUS.MANGALVAR_PETH;
    }
    if (title.includes('tarabai')) {
      return norm === CAMPUS.TARABAI_PARK;
    }
    return false;
  });
};

/**
 * Filters marks records by campus.
 */
export const filterMarksByBranch = (marks, targetBranch) => {
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return marks;
  const norm = normalizeBranch(targetBranch);
  if (!norm) return marks;
  return (marks || []).filter(m => {
    // 1. Direct branch field on mark
    const br = m?.branch || '';
    if (br) {
      const match = normalizeBranch(br);
      if (match) return match === norm;
    }
    // 2. Batch field on mark
    const b = m?.batch || m?.standard || m?.classBatch || '';
    if (b) {
      const match = normalizeBranch(b);
      if (match) return match === norm;
    }
    // 3. Roll number prefix: MP vs TP
    const roll = (m?.rollNumber || m?.roll_number || '').toUpperCase();
    if (roll.includes('MP') || roll.startsWith('SA-MP')) return norm === CAMPUS.MANGALVAR_PETH;
    if (roll.includes('TP') || roll.startsWith('SA-TP')) return norm === CAMPUS.TARABAI_PARK;

    // 4. Exam Name heuristics
    const examName = (m?.examName || m?.examTitle || m?.exam_name || '').toLowerCase();
    if (examName.includes('mangalvar') || examName.includes('mangalwar') || examName.includes('manglavar')) {
      return norm === CAMPUS.MANGALVAR_PETH;
    }
    if (examName.includes('tarabai')) {
      return norm === CAMPUS.TARABAI_PARK;
    }

    // 5. Student name heuristics for demo records
    const sName = (m?.studentName || m?.student_name || '').toLowerCase();
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
 * Filters attendance records / reports by campus.
 */
export const filterAttendanceByBranch = (records, targetBranch) => {
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return records;
  const norm = normalizeBranch(targetBranch);
  if (!norm) return records;
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
    if (roll.includes('MP') || roll.includes('-MP-') || roll.startsWith('SA-MP')) return norm === CAMPUS.MANGALVAR_PETH;
    if (roll.includes('TP') || roll.includes('-TP-') || roll.startsWith('SA-TP')) return norm === CAMPUS.TARABAI_PARK;
    return false;
  });
};

/**
 * Filters fee records / receipts by campus.
 */
export const filterFeesByBranch = (fees, targetBranch) => {
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return fees;
  const norm = normalizeBranch(targetBranch);
  if (!norm) return fees;
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
    if (roll.includes('MP') || roll.includes('-MP-') || roll.startsWith('SA-MP')) return norm === CAMPUS.MANGALVAR_PETH;
    if (roll.includes('TP') || roll.includes('-TP-') || roll.startsWith('SA-TP')) return norm === CAMPUS.TARABAI_PARK;
    return false;
  });
};

/**
 * Checks whether a leave request belongs to a target branch.
 */
export const isLeaveInBranch = (leave, targetBranch) => {
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return true;
  const normTarget = normalizeBranch(targetBranch);
  if (!normTarget) return true;

  const br = leave?.branch || '';
  if (br) {
    const match = normalizeBranch(br);
    if (match) return match === normTarget;
  }

  const tName = (leave?.teacher_name || leave?.teacherName || '').toLowerCase();
  if (tName.includes('sharma') || tName.includes('mangalvar') || tName.includes('mangalwar')) {
    return normTarget === CAMPUS.MANGALVAR_PETH;
  }
  if (tName.includes('patil') || tName.includes('tarabai')) {
    return normTarget === CAMPUS.TARABAI_PARK;
  }
  const email = (leave?.teacher_email || leave?.email || '').toLowerCase();
  if (email.includes('tarabai')) return normTarget === CAMPUS.TARABAI_PARK;
  if (email.includes('mangal')) return normTarget === CAMPUS.MANGALVAR_PETH;
  return true;
};

/**
 * Checks whether a teacher belongs to a target branch.
 */
export const isTeacherInBranch = (teacher, targetBranch) => {
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return true;
  const norm = normalizeBranch(targetBranch);
  if (!norm) return true;

  // 1. Direct branch attribute
  if (teacher?.branch) {
    const match = normalizeBranch(teacher.branch);
    if (match) return match === norm;
  }

  // 2. Assigned batches
  const batches = teacher?.assignedClasses || teacher?.assigned_batches || [];
  if (Array.isArray(batches) && batches.length > 0) {
    const hasBranchBatch = batches.some(b => {
      const bNorm = normalizeBranch(b);
      return bNorm === norm;
    });
    if (hasBranchBatch) return true;
  }

  // 3. Email
  const email = (teacher?.email || '').toLowerCase();
  if (email.includes('tarabai')) return norm === CAMPUS.TARABAI_PARK;
  if (email.includes('mangal') || email.includes('admin@')) return norm === CAMPUS.MANGALVAR_PETH;

  // 4. Name heuristics for demo accounts
  const name = (teacher?.name || teacher?.full_name || '').toLowerCase();
  if (name.includes('sunita') || name.includes('more')) return norm === CAMPUS.TARABAI_PARK;
  if (name.includes('rajesh') || name.includes('sawant') || name.includes('priya')) {
    if (email.includes('tarabai')) return norm === CAMPUS.TARABAI_PARK;
    return norm === CAMPUS.MANGALVAR_PETH;
  }

  return true;
};

/**
 * Filters faculty list by branch.
 */
export const filterTeachersByBranch = (teachers, targetBranch) => {
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return teachers;
  return (teachers || []).filter(t => isTeacherInBranch(t, targetBranch));
};

/**
 * Filters faculty leave requests by branch.
 */
export const filterLeavesByBranch = (leaves, targetBranch) => {
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return leaves;
  const norm = normalizeBranch(targetBranch);
  if (!norm) return leaves;

  return (leaves || []).filter(l => {
    if (l.branch) {
      const match = normalizeBranch(l.branch);
      if (match) return match === norm;
    }
    const tName = (l.teacher_name || l.teacherName || '').toLowerCase();
    if (tName.includes('sunita') || tName.includes('more')) return norm === CAMPUS.TARABAI_PARK;
    if (tName.includes('rajesh') || tName.includes('sawant') || tName.includes('priya')) {
      const email = (l.teacher_email || l.email || '').toLowerCase();
      if (email.includes('tarabai')) return norm === CAMPUS.TARABAI_PARK;
      return norm === CAMPUS.MANGALVAR_PETH;
    }
    return isLeaveInBranch(l, norm);
  });
};

/**
 * Filters daily activities by branch.
 */
export const filterActivitiesByBranch = (activities, targetBranch) => {
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return activities;
  const norm = normalizeBranch(targetBranch);
  if (!norm) return activities;

  return (activities || []).filter(act => {
    if (act.branch) {
      const match = normalizeBranch(act.branch);
      if (match) return match === norm;
    }
    const batch = act.batch || act.classBatch || act.class_code || '';
    if (batch) {
      const match = normalizeBranch(batch);
      if (match) return match === norm;
    }
    return false;
  });
};

/**
 * Filters topic duration plans by branch.
 */
export const filterTopicPlansByBranch = (topics, targetBranch) => {
  if (!targetBranch || targetBranch === 'All' || targetBranch === 'ALL' || targetBranch === 'All Branches') return topics;
  const norm = normalizeBranch(targetBranch);
  if (!norm) return topics;

  return (topics || []).filter(t => {
    if (t.branch) {
      const match = normalizeBranch(t.branch);
      if (match) return match === norm;
    }
    const batch = t.batch || t.batch_name || '';
    if (batch) {
      const match = normalizeBranch(batch);
      if (match) return match === norm;
    }
    return false;
  });
};

