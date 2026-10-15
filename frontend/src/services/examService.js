import api from './api';

const formatTimeDisplay = (timeVal) => {
  if (!timeVal) return '10:00 AM';
  if (typeof timeVal === 'string' && timeVal.includes('T')) {
    const timePart = timeVal.split('T')[1].substring(0, 5);
    const [h, m] = timePart.split(':');
    const hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${m} ${ampm}`;
  }
  if (typeof timeVal === 'string' && (timeVal.toUpperCase().includes('AM') || timeVal.toUpperCase().includes('PM'))) {
    return timeVal;
  }
  if (typeof timeVal === 'string' && timeVal.includes(':')) {
    const [h, m] = timeVal.split(':');
    const hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${m.substring(0, 2)} ${ampm}`;
  }
  return String(timeVal);
};

export const normalizeDateStr = (dateVal) => {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }
    // YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {}
  return new Date().toISOString().split('T')[0];
};

export const normalizeTimeTo24h = (timeVal) => {
  if (!timeVal) return '10:00';
  if (typeof timeVal === 'string' && timeVal.includes('T')) {
    return timeVal.split('T')[1].substring(0, 5);
  }
  if (typeof timeVal === 'string') {
    const trimmed = timeVal.trim();
    // 12-hour format e.g. "01:00 pm", "1:00PM", "10:30 AM"
    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const mins = match12[2];
      const ampm = match12[3] ? match12[3].toUpperCase() : null;
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${mins}`;
    }
    // Single hour e.g. "1 PM"
    const matchHourOnly = trimmed.match(/^(\d{1,2})\s*(am|pm)$/i);
    if (matchHourOnly) {
      let hours = parseInt(matchHourOnly[1], 10);
      const ampm = matchHourOnly[2].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:00`;
    }
    // 24-hour e.g. "13:00", "9:30"
    if (trimmed.includes(':')) {
      const [h, m] = trimmed.split(':');
      const hours = parseInt(h, 10);
      if (!isNaN(hours)) {
        return `${String(hours).padStart(2, '0')}:${(m || '00').substring(0, 2)}`;
      }
    }
  }
  return '10:00';
};

export const parseDurationToMinutes = (durStr) => {
  if (!durStr) return 120;
  if (typeof durStr === 'number') return Math.round(durStr * 60);
  const str = String(durStr).toLowerCase().trim();
  const minsMatch = str.match(/^(\d+)\s*(?:min|minute|m)/);
  if (minsMatch) return parseInt(minsMatch[1], 10);
  const hoursMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h)?/);
  if (hoursMatch) {
    return Math.round(parseFloat(hoursMatch[1]) * 60);
  }
  return 120;
};

const extractTimeInput = (timeVal) => {
  return normalizeTimeTo24h(timeVal);
};

export const examService = {
  getAll: async (params = {}) => {
    const res = await api.get('/exams', { params });
    return res.data.map(exam => {
      const examDateStr = exam.exam_date
        ? (typeof exam.exam_date === 'string'
            ? exam.exam_date.split('T')[0]
            : new Date(exam.exam_date).toISOString().split('T')[0])
        : 'N/A';

      const startTimeStr = formatTimeDisplay(exam.start_time);
      const endTimeStr = formatTimeDisplay(exam.end_time);

      const startTimeInput = extractTimeInput(exam.start_time);
      const endTimeInput = extractTimeInput(exam.end_time);

      return {
        id: exam.id,
        title: exam.exam_name,
        examName: exam.exam_name,
        exam_name: exam.exam_name,
        examType: exam.exam_type || 'Regular',
        exam_type: exam.exam_type || 'Regular',
        standard: exam.standard,
        examStandard: exam.standard,
        section: exam.section || '',
        batch: exam.batch || exam.section || 'General',
        branch: exam.branch || 'Tarabai Park',
        classBatch: exam.section ? `${exam.standard} (${exam.section})` : (exam.batch ? `${exam.standard} (${exam.batch})` : exam.standard),
        subject: exam.subject,
        date: examDateStr,
        examDate: examDateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        startTimeInput,
        endTimeInput,
        duration: exam.duration || '2 Hours',
        totalMarks: exam.max_marks || 100,
        maxMarks: exam.max_marks || 100,
        max_marks: exam.max_marks || 100,
        passingMarks: exam.passing_marks || 35,
        roomNo: exam.room_no || exam.roomNo || 'Room 101',
        room_no: exam.room_no || exam.roomNo || 'Room 101',
        status: exam.status || 'Scheduled',
        teacher_id: exam.teacher_id || '',
        teacher_name: exam.teacher_name || ''
      };
    });
  },

  create: async (data) => {
    const rawDate = data.date || data.exam_date || data.examDate || new Date().toISOString().split('T')[0];
    const dateStr = normalizeDateStr(rawDate);

    const rawStartTime = data.startTime || data.start_time || data.startTimeInput || '10:00';
    const start24 = normalizeTimeTo24h(rawStartTime);

    let end24 = null;
    const rawEndTime = data.endTime || data.end_time || data.endTimeInput;
    if (rawEndTime) {
      end24 = normalizeTimeTo24h(rawEndTime);
      const [sH, sM] = start24.split(':').map(Number);
      const [eH, eM] = end24.split(':').map(Number);
      if (eH * 60 + eM <= sH * 60 + sM) {
        end24 = null; // invalid/earlier end time, recalculate from duration
      }
    }

    if (!end24) {
      const durMins = parseDurationToMinutes(data.duration || '2 Hours');
      const [sH, sM] = start24.split(':').map(Number);
      const endTotalMins = sH * 60 + sM + durMins;
      const endH = Math.floor(endTotalMins / 60) % 24;
      const endM = endTotalMins % 60;
      end24 = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }

    const startIso = `${dateStr}T${start24}:00`;
    const endIso = `${dateStr}T${end24}:00`;

    const standardStr = data.standard || data.examStandard || 'General';
    let branchVal = data.branch || 'Tarabai Park';
    if (standardStr.toLowerCase().includes('mangalvar')) {
      branchVal = 'Mangalvar Peth';
    } else if (standardStr.toLowerCase().includes('tarabai')) {
      branchVal = 'Tarabai Park';
    }

    const payload = {
      exam_name: data.examName || data.title || data.exam_name || 'New Examination',
      exam_type: data.examType || data.exam_type || 'Regular',
      standard: standardStr,
      section: data.section || '',
      batch: data.batch || data.section || 'General',
      branch: branchVal,
      subject: data.subject || 'General',
      exam_date: startIso,
      start_time: startIso,
      end_time: endIso,
      duration: data.duration || '2 Hours',
      room_no: data.roomNo || data.room_no || 'Room 101',
      max_marks: Number(data.maxMarks ?? data.max_marks ?? 100),
      passing_marks: Number(data.passingMarks ?? data.passing_marks ?? 35),
      teacher_id: data.teacher_id || ''
    };

    const res = await api.post('/exams', payload);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/exams/${id}`);
    return res.data;
  },

  update: async (id, data) => {
    const payload = {};
    if (data.status !== undefined) payload.status = data.status;
    if (data.examName || data.title || data.exam_name) payload.exam_name = data.examName || data.title || data.exam_name;
    if (data.examType || data.exam_type) payload.exam_type = data.examType || data.exam_type;
    if (data.standard) payload.standard = data.standard;
    if (data.section !== undefined) payload.section = data.section;
    if (data.batch !== undefined) payload.batch = data.batch;
    if (data.branch !== undefined) payload.branch = data.branch;
    if (data.subject !== undefined) payload.subject = data.subject;
    if (data.duration !== undefined) payload.duration = data.duration;
    if (data.roomNo || data.room_no) payload.room_no = data.roomNo || data.room_no;
    if (data.maxMarks !== undefined) payload.max_marks = Number(data.maxMarks);
    if (data.passingMarks !== undefined) payload.passing_marks = Number(data.passingMarks);

    if (data.date || data.startTime || data.endTime || data.start_time || data.end_time) {
      const rawDate = data.date || data.exam_date || new Date().toISOString().split('T')[0];
      const dateStr = normalizeDateStr(rawDate);
      const start24 = normalizeTimeTo24h(data.startTime || data.start_time || '10:00');
      let end24 = (data.endTime || data.end_time) ? normalizeTimeTo24h(data.endTime || data.end_time) : null;

      if (!end24) {
        const durMins = parseDurationToMinutes(data.duration || '2 Hours');
        const [sH, sM] = start24.split(':').map(Number);
        const endTotalMins = sH * 60 + sM + durMins;
        const endH = Math.floor(endTotalMins / 60) % 24;
        const endM = endTotalMins % 60;
        end24 = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }

      payload.exam_date = `${dateStr}T${start24}:00`;
      payload.start_time = `${dateStr}T${start24}:00`;
      payload.end_time = `${dateStr}T${end24}:00`;
    }

    const res = await api.put(`/exams/${id}`, payload);
    return res.data;
  }
};

export default examService;
