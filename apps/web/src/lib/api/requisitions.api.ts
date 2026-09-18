import { apiClient } from '../api-client';

export const requisitionsApi = {
  getAll: async (params?: { status?: string; departmentId?: string; search?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get('/requisitions', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/requisitions/${id}`);
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/requisitions', data);
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.put(`/requisitions/${id}`, data);
    return res.data.data;
  },
  changeStatus: async (id: string, status: string, reason?: string) => {
    const res = await apiClient.patch(`/requisitions/${id}/status`, { status, reason });
    return res.data.data;
  },
  assignRecruiter: async (id: string, recruiterId: string) => {
    const res = await apiClient.post(`/requisitions/${id}/assign-recruiter`, { recruiterId });
    return res.data.data;
  },
  submitApproval: async (id: string, approverIds: string[]) => {
    const res = await apiClient.post(`/requisitions/${id}/submit-approval`, { approverIds });
    return res.data.data;
  },
  approve: async (id: string, comments?: string) => {
    const res = await apiClient.post(`/requisitions/${id}/approve`, { comments });
    return res.data.data;
  },
  reject: async (id: string, reason: string) => {
    const res = await apiClient.post(`/requisitions/${id}/reject`, { reason });
    return res.data.data;
  },
};