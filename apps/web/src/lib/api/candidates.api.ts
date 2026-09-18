import { apiClient } from '../api-client';

export const candidatesApi = {
  getAll: async (params?: { search?: string; source?: string; tag?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get('/candidates', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/candidates/${id}`);
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/candidates', data);
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch(`/candidates/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/candidates/${id}`);
    return res.data.data;
  },
  anonymize: async (id: string) => {
    const res = await apiClient.post(`/candidates/${id}/anonymize`);
    return res.data.data;
  },
  checkDuplicates: async (dto: { email?: string; phone?: string; firstName?: string; lastName?: string }) => {
    const res = await apiClient.post('/candidates/check-duplicates', dto);
    return res.data.data;
  },
  importFile: async (file: File, requisitionId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/candidates/import', formData, {
      params: { requisitionId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // Application endpoints
  getApplications: async (params?: { requisitionId?: string; candidateId?: string; stage?: string; outcome?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get('/applications', { params });
    return res.data.data;
  },
  getApplicationById: async (id: string) => {
    const res = await apiClient.get(`/applications/${id}`);
    return res.data.data;
  },
  createApplication: async (data: { candidateId: string; requisitionId: string; notes?: string; rating?: number; nextAction?: string; nextActionDueDate?: string }) => {
    const res = await apiClient.post('/applications', data);
    return res.data.data;
  },
  transitionStage: async (id: string, stage: string, reason?: string, notes?: string, nextAction?: string, nextActionDueDate?: string) => {
    const res = await apiClient.post(`/applications/${id}/stage`, {
      stage,
      reason,
      notes,
      nextAction,
      nextActionDueDate,
    });
    return res.data.data;
  },
  rejectApplication: async (id: string, reason: string, notes?: string) => {
    const res = await apiClient.post(`/applications/${id}/reject`, { reason, notes });
    return res.data.data;
  },
  getStageHistory: async (id: string) => {
    const res = await apiClient.get(`/applications/${id}/history`);
    return res.data.data;
  },
  createScreening: async (applicationId: string, data: any) => {
    const res = await apiClient.post(`/applications/${applicationId}/screening`, data);
    return res.data.data;
  },
  getScreenings: async (applicationId: string) => {
    const res = await apiClient.get(`/applications/${applicationId}/screening`);
    return res.data.data;
  },
};