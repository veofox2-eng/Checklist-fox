import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Depending on backend port
    headers: {
        'Content-Type': 'application/json'
    }
});

export const profileService = {
    getProfiles: () => api.get('/profiles'),
    createProfile: (data) => api.post('/profiles', data),
    login: (profile_id, password) => api.post('/profiles/login', { profile_id, password }),
    updateProfile: (id, data) => api.put(`/profiles/${id}`, data),
    deleteProfile: (id) => api.delete(`/profiles/${id}`)
};

export const checklistService = {
    getChecklists: (profile_id) => api.get(`/checklists?profile_id=${profile_id}`),
    createChecklist: (data) => api.post('/checklists', data),
    getChecklist: (id) => api.get(`/checklists/${id}`),
    updateChecklist: (id, data) => api.put(`/checklists/${id}`, data),
    deleteChecklist: (id) => api.delete(`/checklists/${id}`),
    getTasks: (id) => api.get(`/checklists/${id}/tasks`),
    createTask: (data) => api.post('/tasks', data),
    updateTask: (id, data) => api.put(`/tasks/${id}`, data),
    deleteTask: (id) => api.delete(`/tasks/${id}`)
};

export default api;
