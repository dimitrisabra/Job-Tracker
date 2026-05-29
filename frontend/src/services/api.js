import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestPath = error.config?.url || '';
    const isAuthCheck = requestPath.includes('/auth/me');

    if (error.response?.status === 401 && isAuthCheck) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login:  (data) => api.post('/auth/login', data),
  getMe:  ()     => api.get('/auth/me'),
};

export const jobsAPI = {
  getAll:      (params) => api.get('/jobs', { params }),
  getStats:    ()       => api.get('/jobs/stats'),
  getOne:      (id)     => api.get(`/jobs/${id}`),
  create:      (data)   => api.post('/jobs', data),
  update:      (id, data) => api.put(`/jobs/${id}`, data),
  delete:      (id)     => api.delete(`/jobs/${id}`),
  aiSuggest:   (id)     => api.post(`/jobs/${id}/ai-suggest`),
  getActivity: ()       => api.get('/jobs/activity'),
};

export const postingsAPI = {
  getAll:   (params) => api.get('/postings', { params }),
  getOne:   (id)     => api.get(`/postings/${id}`),
  apply:    (id, data) => api.post(`/postings/${id}/apply`, data),
  // Admin
  adminGetAll:    (params) => api.get('/postings/admin/all', { params }),
  adminCreate:    (data)   => api.post('/postings/admin', data),
  adminUpdate:    (id, data) => api.put(`/postings/admin/${id}`, data),
  adminDelete:    (id)     => api.delete(`/postings/admin/${id}`),
  adminToggle:    (id)     => api.patch(`/postings/admin/${id}/toggle`),
};

export const userAPI = {
  getProfile:     ()     => api.get('/users/profile'),
  updateProfile:  (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  getActivity:    ()     => api.get('/users/activity'),
};

export const adminAPI = {
  getStats:      ()       => api.get('/admin/stats'),
  getUsers:      (params) => api.get('/admin/users', { params }),
  getUser:       (id)     => api.get(`/admin/users/${id}`),
  updateStatus:  (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
  deleteUser:    (id)     => api.delete(`/admin/users/${id}`),
  // User's jobs management
  getUserJobs:   (userId, params) => api.get(`/admin/users/${userId}/jobs`, { params }),
  createJobForUser: (userId, data) => api.post(`/admin/users/${userId}/jobs`, data),
  updateJobForUser: (userId, jobId, data) => api.put(`/admin/users/${userId}/jobs/${jobId}`, data),
  deleteJobForUser: (userId, jobId)  => api.delete(`/admin/users/${userId}/jobs/${jobId}`),
  // All jobs
  getAllJobs:    (params) => api.get('/admin/jobs', { params }),
  getActivity:  ()       => api.get('/admin/activity'),
};

export default api;
