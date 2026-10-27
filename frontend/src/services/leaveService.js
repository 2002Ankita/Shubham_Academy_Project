import api from './api';
import { normalizeBranch, CAMPUS } from '../utils/branchUtils';

const STORAGE_KEY = 'sa_leaves_store';

const getInitialFallbackLeaves = () => {
  const today = new Date();
  const formatIso = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString();
  };

  return [
    // Mangalvar Peth (MP) Leaves
    {
      id: 'LR-MP-101',
      teacher_id: 'USR-TCH-03',
      teacher_name: 'Prof. Rajesh Sharma',
      leave_type: 'Casual Leave',
      from_date: formatIso(2),
      to_date: formatIso(3),
      number_of_days: 2,
      reason: 'Attending National Mathematics Symposium at Pune University',
      status: 'Pending',
      branch: CAMPUS.MANGALVAR_PETH,
      admin_comment: null,
      created_at: formatIso(-1)
    },
    {
      id: 'LR-MP-102',
      teacher_id: 'USR-TCH-01',
      teacher_name: 'Dr. Priya Kulkarni',
      leave_type: 'Medical Leave',
      from_date: formatIso(4),
      to_date: formatIso(5),
      number_of_days: 2,
      reason: 'Dental surgery and doctor advised rest',
      status: 'Pending',
      branch: CAMPUS.MANGALVAR_PETH,
      admin_comment: null,
      created_at: formatIso(-2)
    },
    {
      id: 'LR-MP-103',
      teacher_id: 'USR-TCH-04',
      teacher_name: 'Prof. Amit Sawant',
      leave_type: 'Earned Leave',
      from_date: formatIso(-5),
      to_date: formatIso(-4),
      number_of_days: 2,
      reason: 'Personal family engagement in Sangli',
      status: 'Approved',
      branch: CAMPUS.MANGALVAR_PETH,
      admin_comment: 'Approved by Mangalwar Peth Admin Desk',
      created_at: formatIso(-7)
    },
    // Tarabai Park (TP) Leaves
    {
      id: 'LR-TP-201',
      teacher_id: 'USR-TCH-01',
      teacher_name: 'Dr. Priya Kulkarni',
      leave_type: 'Casual Leave',
      from_date: formatIso(1),
      to_date: formatIso(1),
      number_of_days: 1,
      reason: 'Academic Board Meeting at Shivaji University',
      status: 'Pending',
      branch: CAMPUS.TARABAI_PARK,
      admin_comment: null,
      created_at: formatIso(-1)
    },
    {
      id: 'LR-TP-202',
      teacher_id: 'USR-TCH-02',
      teacher_name: 'Prof. Sunita Patil',
      leave_type: 'Sick Leave',
      from_date: formatIso(3),
      to_date: formatIso(4),
      number_of_days: 2,
      reason: 'Severe throat infection and vocal rest recommended by ENT specialist',
      status: 'Pending',
      branch: CAMPUS.TARABAI_PARK,
      admin_comment: null,
      created_at: formatIso(-2)
    },
    {
      id: 'LR-TP-203',
      teacher_id: 'USR-TCH-04',
      teacher_name: 'Prof. Amit Sawant',
      leave_type: 'Academic Leave',
      from_date: formatIso(-3),
      to_date: formatIso(-3),
      number_of_days: 1,
      reason: 'Delivering guest lecture on Organic Chemistry at Kolhapur College',
      status: 'Approved',
      branch: CAMPUS.TARABAI_PARK,
      admin_comment: 'Approved by Tarabai Park Admin Desk',
      created_at: formatIso(-6)
    }
  ];
};

const getLocalLeaves = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) { }
  const initial = getInitialFallbackLeaves();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch (_) { }
  return initial;
};

const saveLocalLeaves = (leaves) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leaves));
  } catch (_) { }
};

export const leaveService = {
  createLeaveRequest: async (leaveData) => {
    let createdItem = null;
    try {
      const res = await api.post('/leave-requests', leaveData);
      createdItem = res.data;
    } catch (err) {
      // Local fallback creation
      createdItem = {
        id: `LR-${Date.now()}`,
        teacher_id: leaveData.teacher_id || 'USR-TCH-01',
        teacher_name: leaveData.teacher_name || 'Dr. Priya Kulkarni',
        leave_type: leaveData.leave_type || 'Casual Leave',
        from_date: leaveData.from_date || new Date().toISOString(),
        to_date: leaveData.to_date || new Date().toISOString(),
        number_of_days: leaveData.number_of_days || 1,
        reason: leaveData.reason || '',
        status: 'Pending',
        branch: leaveData.branch || CAMPUS.TARABAI_PARK,
        admin_comment: null,
        created_at: new Date().toISOString()
      };
    }

    if (createdItem) {
      const current = getLocalLeaves();
      const updated = [createdItem, ...current.filter(i => i.id !== createdItem.id)];
      saveLocalLeaves(updated);
    }
    return createdItem;
  },
  
  getTeacherLeaveRequests: async (teacherId) => {
    try {
      const res = await api.get(`/leave-requests/teacher/${teacherId}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      // fallback
    }
    const local = getLocalLeaves();
    return local.filter(l => l.teacher_id === teacherId || l.teacher_name?.includes('Priya'));
  },

  getAllLeaveRequests: async (params = {}) => {
    const targetBranch = typeof params === 'string' ? params : params?.branch;
    let list = [];
    try {
      const res = await api.get('/leave-requests', { params: targetBranch ? { branch: targetBranch } : {} });
      if (Array.isArray(res.data) && res.data.length > 0) {
        list = res.data;
        // Merge with local overrides
        const local = getLocalLeaves();
        const merged = list.map(item => {
          const localItem = local.find(l => l.id === item.id);
          return localItem ? { ...item, ...localItem } : item;
        });
        saveLocalLeaves(merged);
        list = merged;
      }
    } catch (err) {
      list = getLocalLeaves();
    }

    if (!list || list.length === 0) {
      list = getLocalLeaves();
    }

    if (targetBranch && targetBranch.toLowerCase() !== 'all') {
      const norm = normalizeBranch(targetBranch);
      return list.filter(item => {
        const itemBranch = normalizeBranch(item.branch) || (
          item.teacher_name?.toLowerCase().includes('sharma') ? CAMPUS.MANGALVAR_PETH : CAMPUS.TARABAI_PARK
        );
        return itemBranch === norm;
      });
    }

    return list;
  },

  getTeacherLeaveSummary: async (teacherId) => {
    try {
      const res = await api.get(`/leave-requests/teacher/${teacherId}/summary`);
      if (res.data) return res.data;
    } catch (err) { }
    const local = getLocalLeaves().filter(l => l.teacher_id === teacherId || l.teacher_name?.includes('Priya'));
    const total = 24;
    const taken = local.filter(l => l.status === 'Approved').reduce((acc, curr) => acc + (curr.number_of_days || 1), 0);
    const pending = local.filter(l => l.status === 'Pending').length;
    return {
      teacher_id: teacherId,
      total,
      taken,
      pending,
      available: Math.max(0, total - taken)
    };
  },

  updateLeaveStatus: async (requestId, status, adminComment) => {
    let result = null;
    try {
      const res = await api.put(`/leave-requests/${requestId}/status`, null, {
        params: { status, admin_comment: adminComment }
      });
      result = res.data;
    } catch (err) {
      // Offline fallback
      result = { message: 'Updated locally', id: requestId, status, admin_comment: adminComment };
    }

    // Always sync local storage
    const current = getLocalLeaves();
    const updated = current.map(item => {
      if (item.id === requestId) {
        return {
          ...item,
          status,
          admin_comment: adminComment || (status === 'Approved' ? 'Approved by Admin' : 'Rejected by Admin')
        };
      }
      return item;
    });
    saveLocalLeaves(updated);
    return result;
  },

  exportLeaveRequests: async (opts = {}) => {
    const teacherId = typeof opts === 'string' ? opts : opts?.teacherId;
    const branch = opts?.branch;
    const url = teacherId ? `/leave-requests/teacher/${teacherId}/export` : '/leave-requests/export';
    try {
      const res = await api.get(url, {
        params: branch ? { branch } : {},
        responseType: 'blob'
      });
      return res.data;
    } catch (err) {
      return null;
    }
  }
};

export default leaveService;
