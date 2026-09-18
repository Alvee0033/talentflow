import { apiClient } from '../api-client';

export const tasksApi = {
  getAll: async (params?: { assigneeId?: string; status?: string; priority?: string; type?: string; overdue?: boolean; page?: number; limit?: number }) => {
    const res = await apiClient.get('/tasks', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/tasks/${id}`);
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/tasks', data);
    return res.data.data;
  },
  update: async (id: string, data: any) => {
    const res = await apiClient.patch(`/tasks/${id}`, data);
    return res.data.data;
  },
  complete: async (id: string) => {
    const res = await apiClient.post(`/tasks/${id}/complete`);
    return res.data.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/tasks/${id}`);
    return res.data.data;
  },
};