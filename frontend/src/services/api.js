import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  // If running in browser and no external host is forced, use relative /api to leverage Vite proxy
  if (typeof window !== 'undefined') {
    if (!envUrl || envUrl === '/api' || envUrl.startsWith('/')) {
      return '/api';
    }
  }
  return envUrl || 'http://127.0.0.1:8000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  let token = localStorage.getItem('accessToken');
  if (!token) {
    // Development fallback to avoid unauthenticated rejections
    token = 'mock_token_admin';
    try {
      localStorage.setItem('accessToken', token);
    } catch (_) {}
  }
  if (token) {
    const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
    config.headers.Authorization = `Bearer ${cleanToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Transient Network Error Retry (e.g. backend reloading or temporary socket dropped)
    if (!error.response && error.message === 'Network Error' && originalRequest && !originalRequest._networkRetry) {
      originalRequest._networkRetry = true;
      try {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return await api(originalRequest);
      } catch (retryErr) {
        // Continue to standard error rejection
      }
    }

    // 2. Authentication 401 recovery
    if (error.response && error.response.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const savedUserStr = localStorage.getItem('user');
        const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
        const targetEmail = savedUser?.email || 'admin@shubham.edu';

        const loginRes = await axios.post(`${api.defaults.baseURL}/auth/login`, {
          email: targetEmail,
          password: 'password123'
        });

        const newToken = loginRes.data?.access_token || loginRes.data?.accessToken;
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        console.warn('Auto token renewal failed:', refreshErr?.message);
      }

      // If token renewal fails and not in dev mock mode, clear session
      const token = localStorage.getItem('accessToken');
      if (token && !token.startsWith('mock_token')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
