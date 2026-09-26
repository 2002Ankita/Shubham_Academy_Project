import api from './api';

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const token = response.data?.access_token || response.data?.accessToken;
      if (token) {
        localStorage.setItem('accessToken', token);
        
        // Fetch user info using the token
        const meResponse = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const user = meResponse.data;
        
        // Format to match what the frontend expects
        const formattedUser = {
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role.toLowerCase().replace('_', '-'), // SUPER_ADMIN -> super-admin
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
            title: user.role
        };
        
        localStorage.setItem('user', JSON.stringify(formattedUser));
        return { accessToken: token, user: formattedUser };
      }
    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message);
      throw new Error(err.response?.data?.detail || 'Invalid email or password');
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout failed, clearing local session:', err.message);
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
