import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('secureshare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired on non-public routes, clear local storage
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/view/')) {
      // Avoid redirect loop on public share views
      if (!['/login', '/register', '/'].includes(window.location.pathname)) {
        localStorage.removeItem('secureshare_token');
        localStorage.removeItem('secureshare_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  async login(data) {
    const res = await api.post('/auth/login', data);
    return res.data;
  },
  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout() {
    localStorage.removeItem('secureshare_token');
    localStorage.removeItem('secureshare_user');
  },
};

export const documentService = {
  async upload(formData, onProgress) {
    const res = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },
  async list() {
    const res = await api.get('/documents');
    return res.data;
  },
  async get(id) {
    const res = await api.get(`/documents/${id}`);
    return res.data;
  },
  async preview(id) {
    const res = await api.get(`/documents/${id}/preview`);
    return res.data;
  },
  async delete(id) {
    const res = await api.delete(`/documents/${id}`);
    return res.data;
  },
};

export const shareService = {
  async create(documentId, data) {
    const res = await api.post(`/documents/${documentId}/shares`, data);
    return res.data;
  },
  async list() {
    const res = await api.get('/shares');
    return res.data;
  },
  async listReceived() {
    const res = await api.get('/shares/received');
    return res.data;
  },
  async get(id) {
    const res = await api.get(`/shares/${id}`);
    return res.data;
  },
  async revoke(id) {
    const res = await api.post(`/shares/${id}/revoke`);
    return res.data;
  },
};

export const viewerService = {
  async inspectShare(token) {
    const res = await api.get(`/public/shares/${token}`);
    return res.data;
  },
  async getMetadata(token) {
    const res = await api.get(`/public/shares/${token}`);
    return res.data;
  },
  async startSession(token) {
    const res = await api.post(`/public/shares/${token}/sessions`);
    return res.data;
  },
  async closeSession(token, sessionId) {
    const res = await api.post(`/public/shares/${token}/sessions/${sessionId}/close`);
    return res.data;
  },
  async fetchPageImage(token, pageNumber, sessionId) {
    const res = await api.get(`/public/shares/${token}/pages/${pageNumber}`, {
      params: { sessionId },
      responseType: 'blob',
    });
    return URL.createObjectURL(res.data);
  },
  async reportSecurityEvent(token, payload) {
    try {
      await api.post(`/public/shares/${token}/security-event`, payload);
    } catch (_) {}
  },
  async logEvent(token, payload) {
    try {
      await api.post(`/public/shares/${token}/security-event`, payload);
    } catch (_) {}
  },
};

export const auditService = {
  async list(limit = 50) {
    const res = await api.get('/audit', { params: { limit } });
    return res.data;
  },
};

export default api;
