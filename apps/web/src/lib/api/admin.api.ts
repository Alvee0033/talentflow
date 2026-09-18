import { apiClient } from '../api-client';

export const adminApi = {
  // Users
  getUsers: async (params?: { page?: number; limit?: number; search?: string; departmentId?: string; isActive?: boolean; role?: string }) => {
    const res = await apiClient.get('/users', { params });
    return res.data.data;
  },
  getUserById: async (id: string) => {
    const res = await apiClient.get(`/users/${id}`);
    return res.data.data;
  },
  createUser: async (data: any) => {
    const res = await apiClient.post('/users', data);
    return res.data.data;
  },
  updateUser: async (id: string, data: any) => {
    const res = await apiClient.put(`/users/${id}`, data);
    return res.data.data;
  },
  deleteUser: async (id: string) => {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data.data;
  },
  assignRoles: async (id: string, roleIds: string[]) => {
    const res = await apiClient.post(`/users/${id}/roles`, { roleIds });
    return res.data.data;
  },

  // Roles & Permissions
  getRoles: async () => {
    const res = await apiClient.get('/roles');
    return res.data.data;
  },
  getRoleById: async (id: string) => {
    const res = await apiClient.get(`/roles/${id}`);
    return res.data.data;
  },
  getPermissions: async () => {
    const res = await apiClient.get('/roles/permissions');
    return res.data.data;
  },
  createRole: async (data: any) => {
    const res = await apiClient.post('/roles', data);
    return res.data.data;
  },
  updateRole: async (id: string, data: any) => {
    const res = await apiClient.put(`/roles/${id}`, data);
    return res.data.data;
  },
  deleteRole: async (id: string) => {
    const res = await apiClient.delete(`/roles/${id}`);
    return res.data.data;
  },

  // Organization
  getBusinessUnits: async () => {
    const res = await apiClient.get('/organization/business-units');
    return res.data.data;
  },
  getDepartments: async (businessUnitId?: string) => {
    const res = await apiClient.get('/organization/departments', { params: { businessUnitId, limit: 100 } });
    return res.data.data;
  },
  getPositions: async (departmentId?: string) => {
    const res = await apiClient.get('/organization/positions', { params: { departmentId } });
    return res.data.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: { page?: number; limit?: number; entityType?: string; action?: string }) => {
    const res = await apiClient.get('/audit-logs', { params });
    return res.data.data;
  },
};

export const organizationApi = adminApi;