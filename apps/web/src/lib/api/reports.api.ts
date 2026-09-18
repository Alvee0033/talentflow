import { apiClient } from '../api-client';

export const reportsApi = {
  getPipelineVelocity: async () => {
    const res = await apiClient.get('/reports/pipeline-velocity');
    return res.data.data;
  },
  getSourceEffectiveness: async () => {
    const res = await apiClient.get('/reports/source-effectiveness');
    return res.data.data;
  },
  getRecruiterPerformance: async () => {
    const res = await apiClient.get('/reports/recruiter-performance');
    return res.data.data;
  },
  getDepartmentHiring: async () => {
    const res = await apiClient.get('/reports/department-hiring');
    return res.data.data;
  },
  exportReport: async (reportType: string, format: 'xlsx' | 'csv' = 'xlsx') => {
    const res = await apiClient.get('/reports/export', {
      params: { reportType, format },
      responseType: 'blob',
    });
    return res.data;
  },
};
