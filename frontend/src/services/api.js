import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
};

export const jobsAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  createJob: (jobData) => api.post('/jobs', jobData),
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  archiveJob: (id) => api.post(`/jobs/${id}/archive`),
  restoreJob: (id) => api.post(`/jobs/${id}/restore`),
};

export const assignmentsAPI = {
  assignTechnician: (jobId, technicianId) => 
    api.post(`/assignments/${jobId}/technicians/${technicianId}`),
  removeTechnician: (jobId, technicianId) => 
    api.delete(`/assignments/${jobId}/technicians/${technicianId}`),
  bulkAssign: (jobIds, technicianId) => 
    api.post('/assignments/bulk-assign', { jobIds, technicianId }),
};

export const lifecycleAPI = {
  updateStatus: (jobId, status, completionNote) => 
    api.put(`/lifecycle/${jobId}/status`, { status, completionNote }),
  getRunningLate: () => api.get('/lifecycle/alerts/running-late'),
};

export const partsAPI = {
  addPart: (partData) => api.post('/parts', partData),
  getJobParts: (jobId) => api.get(`/parts/job/${jobId}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  exportCSV: (date) => api.get(`/dashboard/export/${date}`, { responseType: 'blob' }),
};

export default api;