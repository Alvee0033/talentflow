import { apiClient } from '../api-client';

export const interviewsApi = {
  getAll: async (params?: { applicationId?: string; panelistId?: string; status?: string; from?: string; to?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get('/interviews', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/interviews/${id}`);
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/interviews', data);
    return res.data.data;
  },
  reschedule: async (id: string, newStartTime: string, newEndTime: string, reason: string) => {
    const res = await apiClient.post(`/interviews/${id}/reschedule`, { newStartTime, newEndTime, reason });
    return res.data.data;
  },
  cancel: async (id: string, reason?: string) => {
    const res = await apiClient.post(`/interviews/${id}/cancel`, { reason });
    return res.data.data;
  },
  complete: async (id: string) => {
    const res = await apiClient.post(`/interviews/${id}/complete`);
    return res.data.data;
  },
  // Evaluations
  getEvaluations: async (interviewId: string) => {
    const res = await apiClient.get(`/evaluations/interview/${interviewId}`);
    return res.data.data;
  },
  submitEvaluation: async (data: any) => {
    const res = await apiClient.post('/evaluations', data);
    return res.data.data;
  },
  getEvaluationForms: async (departmentId?: string) => {
    const res = await apiClient.get('/evaluation-forms', { params: { departmentId } });
    return res.data.data;
  },
  createEvaluationForm: async (data: any) => {
    const res = await apiClient.post('/evaluation-forms', data);
    return res.data.data;
  },
  updateEvaluationForm: async (id: string, data: any) => {
    const res = await apiClient.patch(`/evaluation-forms/${id}`, data);
    return res.data.data;
  },
  deleteEvaluationForm: async (id: string) => {
    const res = await apiClient.delete(`/evaluation-forms/${id}`);
    return res.data.data;
  },
};