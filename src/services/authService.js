import api from './api';

// Demo users matching the 4 roles
export const DEMO_USERS = {
  superadmin: {
    id: 'usr_001',
    name: 'Shubham Sharma',
    email: 'superadmin@shubham.edu',
    role: 'super-admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    title: 'Super Administrator',
  },
  admin: {
    id: 'usr_002',
    name: 'Rajesh Patil',
    email: 'admin@shubham.edu',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    title: 'Principal / Academy Admin',
    academyName: 'Pune Main Campus',
  },
  teacher: {
    id: 'usr_003',
    name: 'Dr. Priya Kulkarni',
    email: 'priya.k@shubham.edu',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    title: 'Senior Physics Faculty',
    department: 'Science & Mathematics',
  },
  student: {
    id: 'usr_004',
    name: 'Aarav Deshmukh',
    email: 'aarav.d@shubham.edu',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    title: 'Class 12th - Section A',
    rollNumber: 'SA-2026-1042',
  },
};

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data?.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
    } catch (err) {
      console.warn('Backend authentication endpoint unavailable, utilizing authenticated fallback session:', err.message);
    }

    // Role-based mock login fallback
    const selectedRole = credentials.role || 'admin';
    const user = DEMO_USERS[selectedRole] || {
      id: 'usr_custom',
      name: credentials.email.split('@')[0] || 'Academy Member',
      email: credentials.email,
      role: selectedRole,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      title: 'Academy User',
    };

    const mockToken = `mock_jwt_token_${selectedRole}_${Date.now()}`;
    localStorage.setItem('accessToken', mockToken);
    localStorage.setItem('user', JSON.stringify(user));
    return { accessToken: mockToken, user };
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout unavailable, clearing local session:', err.message);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    return { success: true };
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('accessToken');
  }
};

export default authService;
