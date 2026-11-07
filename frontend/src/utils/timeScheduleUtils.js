// Utility functions for robust time slot parsing, formatting, matching, and day expansion

export const ALL_STANDARD_WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

/**
 * Parses a single time fragment (e.g. '10.30', '10:30', '10:30 AM', '1:00', '1.00 PM')
 */
export const parseTimeFragment = (str, isEnd = false) => {
  if (!str) return null;
  const clean = String(str).trim();
  // Replace dot with colon between numbers (e.g. 10.30 -> 10:30)
  const dotToColon = clean.replace(/(\d+)\.(\d+)/g, '$1:$2');
  const match = dotToColon.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  let meridiem = (match[3] || '').toUpperCase();

  // Intelligent inference for standard school / coaching hours:
  // - 1 to 6 without meridiem is PM
  // - 7 to 11 without meridiem is AM
  // - 12 without meridiem is PM
  // - End time of 1..11 when start was 10 or 11 is PM
  if (!meridiem) {
    if (hours >= 1 && hours <= 6) {
      meridiem = 'PM';
    } else if (hours >= 7 && hours <= 11) {
      meridiem = 'AM';
    } else if (hours === 12) {
      meridiem = 'PM';
    } else if (isEnd && hours < 12) {
      meridiem = 'PM';
    } else {
      meridiem = 'AM';
    }
  }

  let total24Hours = hours;
  if (meridiem === 'PM' && total24Hours < 12) total24Hours += 12;
  if (meridiem === 'AM' && total24Hours === 12) total24Hours = 0;

  const totalMinutes = total24Hours * 60 + minutes;
  const displayHours = hours === 0 ? 12 : hours;
  const formattedStr = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;

  return {
    rawHours: hours,
    minutes,
    meridiem,
    totalMinutes,
    formattedStr
  };
};

/**
 * Standardize any time range string into e.g. '10:30 AM – 01:00 PM'
 * Handles: '10.30 ro 1:00', '10.30 to 1:00', '10:30 - 1:00', '10:30 AM - 01:00 PM', etc.
 */
export const formatStandardTimeRange = (rawTime) => {
  if (!rawTime) return '09:00 AM – 10:00 AM';
  let s = String(rawTime).trim();
  // Standardize delimiters (to, till, ro, -, –, —)
  s = s.replace(/\b(to|till|ro)\b/gi, '-').replace(/[–—]/g, '-');
  const parts = s.split('-').map((p) => p.trim()).filter(Boolean);

  if (parts.length === 0) return '09:00 AM – 10:00 AM';
  if (parts.length === 1) {
    const single = parseTimeFragment(parts[0], false);
    return single ? single.formattedStr : parts[0];
  }

  const startParsed = parseTimeFragment(parts[0], false);
  const endParsed = parseTimeFragment(parts[1], true);

  if (!startParsed && !endParsed) return rawTime;
  if (!startParsed) return parts[0] + ' – ' + (endParsed ? endParsed.formattedStr : parts[1]);
  if (!endParsed) return startParsed.formattedStr + ' – ' + parts[1];

  // If endParsed totalMinutes is earlier than startParsed, bump end to PM
  if (endParsed.totalMinutes <= startParsed.totalMinutes && endParsed.meridiem === 'AM') {
    endParsed.meridiem = 'PM';
    endParsed.totalMinutes += 12 * 60;
    endParsed.formattedStr = endParsed.formattedStr.replace(/AM/i, 'PM');
  }

  return `${startParsed.formattedStr} – ${endParsed.formattedStr}`;
};

/**
 * Parse start time minutes from midnight for sorting
 */
export const getMinutesFromTimeString = (timeStr) => {
  if (!timeStr) return 0;
  const s = String(timeStr).trim().replace(/\b(to|till|ro)\b/gi, '-').replace(/[–—]/g, '-');
  const firstPart = s.split('-')[0].trim();
  const parsed = parseTimeFragment(firstPart, false);
  return parsed ? parsed.totalMinutes : 0;
};

/**
 * Normalize time strings for matching
 */
export const normalizeTimeString = (t) => {
  if (!t) return '';
  let str = String(t).trim().toLowerCase();
  str = str.replace(/\b(to|till|ro)\b/gi, '-');
  str = str.replace(/[–—]/g, '-');
  str = str.replace(/(\d+)\.(\d+)/g, '$1:$2');
  str = str.replace(/\s*-\s*/g, '-');
  str = str.replace(/\b0(\d:\d\d)/g, '$1');
  str = str.replace(/\s+/g, ' ').trim();
  return str;
};

/**
 * Robustly check if two time strings match
 */
export const timesMatch = (t1, t2) => {
  if (!t1 || !t2) return false;
  const n1 = normalizeTimeString(t1);
  const n2 = normalizeTimeString(t2);
  if (n1 === n2 || n1.includes(n2) || n2.includes(n1)) return true;

  // Extract start times to compare
  const p1 = n1.split('-');
  const p2 = n2.split('-');
  if (p1[0] && p2[0] && p1[0].trim() === p2[0].trim()) return true;

  // Extract minutes for deep numerical matching
  const m1 = getMinutesFromTimeString(t1);
  const m2 = getMinutesFromTimeString(t2);
  if (m1 > 0 && m2 > 0 && Math.abs(m1 - m2) <= 5) return true;

  return false;
};

/**
 * Calculate clean duration label (e.g. 150 mins -> 2h 30m, 60 mins -> 1h (60 mins))
 */
export const getSlotDurationLabel = (slotStr) => {
  if (!slotStr) return '60 mins';
  const s = String(slotStr).trim().replace(/\b(to|till|ro)\b/gi, '-').replace(/[–—]/g, '-');
  const parts = s.split('-').map((p) => p.trim());
  if (parts.length >= 2) {
    const startParsed = parseTimeFragment(parts[0], false);
    const endParsed = parseTimeFragment(parts[1], true);
    if (startParsed && endParsed) {
      let diff = endParsed.totalMinutes - startParsed.totalMinutes;
      if (diff <= 0) diff += 12 * 60; // Cross-noon correction
      if (diff > 0) {
        if (diff % 60 === 0) return `${diff / 60}h (${diff} mins)`;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return h > 0 ? `${h}h ${m}m` : `${m} mins`;
      }
    }
  }
  return '60 mins';
};

export const getSlotDurationShort = (slotStr) => {
  if (!slotStr) return '60m';
  const s = String(slotStr).trim().replace(/\b(to|till|ro)\b/gi, '-').replace(/[–—]/g, '-');
  const parts = s.split('-').map((p) => p.trim());
  if (parts.length >= 2) {
    const startParsed = parseTimeFragment(parts[0], false);
    const endParsed = parseTimeFragment(parts[1], true);
    if (startParsed && endParsed) {
      let diff = endParsed.totalMinutes - startParsed.totalMinutes;
      if (diff <= 0) diff += 12 * 60;
      if (diff > 0) {
        if (diff % 60 === 0) return `${diff / 60}h`;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      }
    }
  }
  return '60m';
};

/**
 * Expands any day specification into an array of full day names
 * Handles:
 * - Empty / undefined -> ALL_STANDARD_WEEKDAYS (Monday to Saturday)
 * - Array of days -> Normalized full day names
 * - 'Daily', 'All Days', 'Mon - Sat', 'Monday to Saturday' -> ALL_STANDARD_WEEKDAYS
 * - 'MWF' / 'Mon, Wed, Fri' -> ['Monday', 'Wednesday', 'Friday']
 * - 'TTS' / 'Tue, Thu, Sat' -> ['Tuesday', 'Thursday', 'Saturday']
 * - Abbreviations ('Mon', 'Tue', etc.) -> Full name
 */
export const expandDaysList = (daysInput) => {
  if (!daysInput) return ALL_STANDARD_WEEKDAYS;

  if (Array.isArray(daysInput)) {
    if (daysInput.length === 0) return ALL_STANDARD_WEEKDAYS;
    const resolved = [];
    daysInput.forEach((item) => {
      resolved.push(...expandDaysList(item));
    });
    return Array.from(new Set(resolved));
  }

  const str = String(daysInput).trim();
  if (!str) return ALL_STANDARD_WEEKDAYS;
  const lower = str.toLowerCase();

  if (
    lower === 'all' ||
    lower.includes('daily') ||
    lower.includes('all days') ||
    lower.includes('mon - sat') ||
    lower.includes('monday to saturday') ||
    lower.includes('all weekdays')
  ) {
    return ALL_STANDARD_WEEKDAYS;
  }

  // Split comma / semicolon / slash delimited strings first
  if (str.includes(',') || str.includes(';') || str.includes('/')) {
    const parts = str.split(/[,;/]+/).map((p) => p.trim()).filter(Boolean);
    const resolved = [];
    parts.forEach((p) => resolved.push(...expandDaysList(p)));
    return Array.from(new Set(resolved));
  }

  if (lower === 'mwf' || lower === 'mon, wed, fri' || lower === 'mon-wed-fri') {
    return ['Monday', 'Wednesday', 'Friday'];
  }

  if (lower === 'tts' || lower === 'tue, thu, sat' || lower === 'tue-thu-sat') {
    return ['Tuesday', 'Thursday', 'Saturday'];
  }

  if (lower.startsWith('mon')) return ['Monday'];
  if (lower.startsWith('tue')) return ['Tuesday'];
  if (lower.startsWith('wed')) return ['Wednesday'];
  if (lower.startsWith('thu')) return ['Thursday'];
  if (lower.startsWith('fri')) return ['Friday'];
  if (lower.startsWith('sat')) return ['Saturday'];
  if (lower.startsWith('sun')) return ['Sunday'];

  return [str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()];
};
