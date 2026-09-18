import { apiClient } from '../api-client';

export const messagesApi = {
  getAll: async (params?: { candidateId?: string; applicationId?: string; status?: string; channel?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get('/messages', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/messages/${id}`);
    return res.data.data;
  },
  createDraft: async (data: any) => {
    const res = await apiClient.post('/messages', data);
    return res.data.data;
  },
  requestApproval: async (id: string) => {
    const res = await apiClient.post(`/messages/${id}/request-approval`);
    return res.data.data;
  },
  approve: async (id: string, notes?: string) => {
    const res = await apiClient.post(`/messages/${id}/approve`, { comments: notes || "Approved by Recruiter", notes });
    return res.data.data;
  },
  reject: async (id: string, reason?: string) => {
    const res = await apiClient.post(`/messages/${id}/reject`, { comments: reason || "Needs revision", reason });
    return res.data.data;
  },
  send: async (id: string) => {
    const res = await apiClient.post(`/messages/${id}/send`);
    return res.data.data;
  },
  getTemplates: async () => {
    const res = await apiClient.get('/templates');
    return res.data.data;
  },
  createTemplate: async (data: any) => {
    const res = await apiClient.post('/templates', data);
    return res.data.data;
  },
  updateTemplate: async (id: string, data: any) => {
    const res = await apiClient.patch(`/templates/${id}`, data);
    return res.data.data;
  },
  deleteTemplate: async (id: string) => {
    const res = await apiClient.delete(`/templates/${id}`);
    return res.data.data;
  },
  renderTemplate: async (id: string, context: Record<string, any>) => {
    const res = await apiClient.post(`/templates/${id}/render`, context);
    return res.data.data;
  },
};