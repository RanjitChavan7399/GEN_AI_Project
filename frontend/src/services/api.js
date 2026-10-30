import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('prepnexus_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('prepnexus_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          localStorage.setItem('prepnexus_access_token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('prepnexus_access_token');
          localStorage.removeItem('prepnexus_refresh_token');
          localStorage.removeItem('prepnexus_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials) => {
    const res = await api.post('/auth/login/', credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register/', userData);
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/profile/');
    return res.data;
  },
  updateProfile: async (profileData) => {
    const res = await api.put('/auth/profile/', profileData);
    return res.data;
  },
  checkHealth: async () => {
    const res = await axios.get(`${API_BASE_URL}/health/`);
    return res.data;
  }
};

export const analyzerAPI = {
  analyzeResume: async (formData) => {
    const res = await api.post('/analyzer/analyze/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  getHistory: async () => {
    const res = await api.get('/analyzer/history/');
    return res.data;
  },
  getAnalysisDetail: async (analysisId) => {
    const res = await api.get(`/analyzer/history/${analysisId}/`);
    return res.data;
  },
  deleteAnalysis: async (analysisId) => {
    const res = await api.delete(`/analyzer/history/${analysisId}/delete/`);
    return res.data;
  }
};

export const companyPrepAPI = {
  getOverview: async (payload) => {
    const res = await api.post('/analyzer/prep/overview/', payload);
    return res.data;
  },
  generateRoadmap: async (payload) => {
    const res = await api.post('/analyzer/generate-roadmap/', payload);
    return res.data;
  },
  getSavedRoadmaps: async () => {
    const res = await api.get('/analyzer/roadmaps/');
    return res.data;
  },
  getQuestions: async (payload) => {
    const res = await api.post('/analyzer/prep/questions/', payload);
    return res.data;
  },
  explainConcept: async (payload) => {
    const res = await api.post('/analyzer/prep/explain-concept/', payload);
    return res.data;
  }
};

export const mockInterviewAPI = {
  startSession: async (payload) => {
    const res = await api.post('/analyzer/mock-interview/start/', payload);
    return res.data;
  },
  evaluateTurn: async (payload) => {
    const res = await api.post('/analyzer/mock-interview/evaluate/', payload);
    return res.data;
  },
  transcribeAudio: async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    const res = await api.post('/analyzer/mock-interview/transcribe/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  finishSession: async (sessionId, endedEarly = false) => {
    const res = await api.post(`/analyzer/mock-interview/${sessionId}/finish/`, { ended_early: endedEarly });
    return res.data;
  },
  getReports: async () => {
    const res = await api.get('/analyzer/mock-interview/reports/');
    return res.data;
  }
};

export const experiencesAPI = {
  getExperiences: async (companyName = '', role = '') => {
    const params = {};
    if (companyName) params.company = companyName;
    if (role) params.role = role;
    const res = await api.get('/analyzer/experiences/', { params });
    return res.data;
  },
  submitExperience: async (data) => {
    const res = await api.post('/analyzer/experiences/', data);
    return res.data;
  },
  upvoteExperience: async (expId) => {
    const res = await api.post(`/analyzer/experiences/${expId}/upvote/`);
    return res.data;
  },
  deleteExperience: async (expId) => {
    const res = await api.delete(`/analyzer/experiences/${expId}/delete/`);
    return res.data;
  },
  flagExperience: async (expId, reason = 'Community report') => {
    const res = await api.post(`/analyzer/experiences/${expId}/flag/`, { reason });
    return res.data;
  },
  approveExperience: async (expId) => {
    const res = await api.post(`/analyzer/experiences/${expId}/approve/`);
    return res.data;
  }
};

export default api;
