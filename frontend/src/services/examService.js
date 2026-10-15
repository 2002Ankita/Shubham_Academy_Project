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

const extractTimeInput = (timeVal) => {
  if (!timeVal) return '10:00';
  if (typeof timeVal === 'string' && timeVal.includes('T')) {
    return timeVal.split('T')[1].substring(0, 5);
  }
  if (typeof timeVal === 'string' && (timeVal.toUpperCase().includes('AM') || timeVal.toUpperCase().includes('PM'))) {
    const parts = timeVal.trim().split(' ');
    if (parts.length >= 2) {
      const [h, m] = parts[0].split(':');
      let hours = parseInt(h, 10);
      const period = parts[1].toUpperCase();
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${m || '00'}`;
    }
  }
  if (typeof timeVal === 'string' && timeVal.includes(':')) {
    return timeVal.substring(0, 5);
  }
  return '10:00';
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
    const dateStr = data.date || data.exam_date || new Date().toISOString().split('T')[0];
    const startTimeRaw = data.startTime || data.start_time || '10:00';
    const endTimeRaw = data.endTime || data.end_time || '12:00';

    const startH = startTimeRaw.length === 5 ? `${startTimeRaw}:00` : startTimeRaw;
    const endH = endTimeRaw.length === 5 ? `${endTimeRaw}:00` : endTimeRaw;

    const startIso = `${dateStr}T${startH}`;
    const endIso = `${dateStr}T${endH}`;

    const payload = {
      exam_name: data.examName || data.title || data.exam_name || 'New Examination',
      exam_type: data.examType || data.exam_type || 'Regular',
      standard: data.standard || data.examStandard || 'General',
      section: data.section || '',
      batch: data.batch || data.section || 'General',
      branch: data.branch || 'Tarabai Park',
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

    if (data.date || data.startTime || data.endTime) {
      const dateStr = data.date || new Date().toISOString().split('T')[0];
      const startH = (data.startTime || '10:00').length === 5 ? `${data.startTime || '10:00'}:00` : (data.startTime || '10:00');
      const endH = (data.endTime || '12:00').length === 5 ? `${data.endTime || '12:00'}:00` : (data.endTime || '12:00');

      payload.exam_date = `${dateStr}T${startH}`;
      payload.start_time = `${dateStr}T${startH}`;
      payload.end_time = `${dateStr}T${endH}`;
    }

    const res = await api.put(`/exams/${id}`, payload);
    return res.data;
  }
};

export default examService;
