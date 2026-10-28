import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

const DEMO_USERS = {
  admin: {
    id: 'USR-ADM-MP-01',
    name: 'Rajesh Patil',
    email: 'admin@shubham.edu',
    role: 'admin',
    branch: 'Mangalvar Peth',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    title: 'ADMIN'
  },
  'super-admin': {
    id: 'USR-SA-MP-01',
    name: 'Shubham Sharma',
    email: 'superadmin@shubham.edu',
    role: 'super-admin',
    branch: 'Mangalvar Peth',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    title: 'SUPER_ADMIN'
  },
  superadmin: {
    id: 'USR-SA-MP-01',
    name: 'Shubham Sharma',
    email: 'superadmin@shubham.edu',
    role: 'super-admin',
    branch: 'Mangalvar Peth',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    title: 'SUPER_ADMIN'
  },
  teacher: {
    id: 'TCH-001',
    name: 'Dr. Priya Kulkarni',
    email: 'priya.k@shubham.edu',
    role: 'teacher',
    branch: 'Tarabai Park',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    title: 'TEACHER'
  },
  student: {
    id: 'STU-001',
    name: 'Aarav Deshmukh',
    email: 'aarav.d@shubham.edu',
    role: 'student',
    branch: 'Tarabai Park',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    title: 'STUDENT'
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = authService.getCurrentUser();
    const token = authService.getToken();
    if (savedUser && token) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Quick switch for demo testing in development
  const switchRole = (roleKey) => {
    const target = DEMO_USERS[roleKey];
    if (target) {
      localStorage.setItem('accessToken', `mock_token_${roleKey}`);
      localStorage.setItem('user', JSON.stringify(target));
      setUser(target);
    }
  };

  // Update user profile in state and localStorage
  const updateUser = async (updatedData) => {
    try {
      const merged = { ...user, ...updatedData };
      const updatedBackend = await authService.updateProfile(merged);
      setUser(updatedBackend);
    } catch (err) {
      console.error('Failed to update profile:', err);
      // Fallback to local update if backend fails during dev
      setUser((prev) => {
        const merged = { ...prev, ...updatedData };
        localStorage.setItem('user', JSON.stringify(merged));
        return merged;
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from '../hooks/useAuth';
export default AuthContext;
