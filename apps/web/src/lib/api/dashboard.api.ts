import { apiClient } from '../api-client';

export const dashboardApi = {
  getRecruiterDashboard: async () => {
    const res = await apiClient.get('/dashboard/recruiter');
    return res.data.data;
  },
  getTAHeadDashboard: async () => {
    const res = await apiClient.get('/dashboard/ta-head');
    return res.data.data;
  },
  getDeptHeadDashboard: async () => {
    const res = await apiClient.get('/dashboard/dept-head');
    return res.data.data;
  },
};