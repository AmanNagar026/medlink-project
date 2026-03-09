import { api } from './api';

export const vitalsService = {
  // Create new vital sign record
  create: (vitalSign) => api.post('/vitals', vitalSign),

  // Get all vitals for a patient
  getByPatient: (patientId) => api.get(`/vitals/patient/${patientId}`),

  // Get latest vital signs
  getLatest: (patientId) => api.get(`/vitals/patient/${patientId}/latest`),

  // Get trend data (7, 30, 90 days)
  getTrendData: (patientId, period = '7') => 
    api.get(`/vitals/patient/${patientId}/trend?period=${period}`),

  // Get vitals summary with status
  getSummary: (patientId) => api.get(`/vitals/patient/${patientId}/summary`),

  // Get single vital record
  getById: (id) => api.get(`/vitals/${id}`),

  // Update vital record
  update: (id, vitalSign) => api.put(`/vitals/${id}`, vitalSign),

  // Delete vital record
  delete: (id) => api.delete(`/vitals/${id}`),
};

export default vitalsService;
