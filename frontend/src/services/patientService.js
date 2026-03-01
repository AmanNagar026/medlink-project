import { api } from './api';

export const patientService = {
  // Get all patients
  getAll: () => api.get('/patient'),

  // Get patient by ID
  getById: (id) => api.get(`/patient/${id}`),

  // Get patient by user ID
  getByUserId: (userId) => api.get(`/patient/user/${userId}`),

  // Get patients by doctor ID
  getByDoctor: (doctorId) => api.get(`/patient/doctor/${doctorId}`),

  // Search patients for a doctor by free-text query
  search: (doctorId, query) =>
    api.get(`/patient/search?doctorId=${doctorId}&query=${encodeURIComponent(query)}`),

  // Update patient
  update: (id, patient) => api.put(`/patient/${id}`, patient),
};

export default patientService;
