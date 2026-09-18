import { apiClient } from '../api-client';

export const joiningApi = {
  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get('/joining', { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/joining/${id}`);
    return res.data.data;
  },
  getByApplicationId: async (applicationId: string) => {
    const res = await apiClient.get(`/joining/application/${applicationId}`);
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post('/joining', data);
    return res.data.data;
  },
  updateItem: async (checklistId: string, itemId: string, data: any) => {
    const res = await apiClient.patch(`/joining/${checklistId}/items/${itemId}`, data);
    return res.data.data;
  },
  complete: async (id: string) => {
    const res = await apiClient.post(`/joining/${id}/complete`);
    return res.data.data;
  },
};