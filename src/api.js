import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://checklist-fox-backend.vercel.app/api',

    headers: {
        'Content-Type': 'application/json'
    }
});

export const profileService = {
    getProfiles: () => api.get('/profiles'),
    createProfile: (data) => api.post('/profiles', data),
    login: (profile_id, password) => api.post('/profiles/login', { profile_id, password }),
    updateProfile: (id, data) => api.put(`/profiles/${id}`, data),
    deleteProfile: (id, password) => api.delete(`/profiles/${id}`, { data: { password } }),
    getShareRequests: (id) => api.get(`/profiles/${id}/share-requests`),
    respondToShareRequest: (requestId, action) => api.post(`/share-requests/${requestId}/respond`, { action })
};

export const checklistService = {
    getChecklists: (profile_id) => api.get(`/checklists?profile_id=${profile_id}`),
    createChecklist: (data) => api.post('/checklists', data),
    getChecklist: (id) => api.get(`/checklists/${id}`),
    updateChecklist: (id, data) => api.put(`/checklists/${id}`, data),
    deleteChecklist: (id, profile_id, password) => api.delete(`/checklists/${id}`, { data: { profile_id, password } }),
    getTasks: (id) => api.get(`/checklists/${id}/tasks`),
    createTask: (data) => api.post('/tasks', data),
    updateTask: (id, data) => api.put(`/tasks/${id}`, data),
    deleteTask: (id) => api.delete(`/tasks/${id}`),
    addTimerLog: (id, elapsed_seconds) => api.post(`/checklists/${id}/timer-logs`, { elapsed_seconds }),
    getTimerLogs: (id) => api.get(`/checklists/${id}/timer-logs`),
    deleteTimerLog: (log_id) => api.delete(`/timer-logs/${log_id}`),
    shareChecklist: (id, sender_id, receiver_name) => api.post(`/checklists/${id}/share`, { sender_id, receiver_name })
};

export default api;
