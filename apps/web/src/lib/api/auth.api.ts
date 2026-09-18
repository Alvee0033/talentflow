import { apiClient } from '../api-client';

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeId?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  roles: string[];
  permissions: string[];
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: AuthUser;
}

export const authApi = {
  login: async (payload: LoginPayload) => {
    const res = await apiClient.post<{ success: boolean; data: LoginResponseData }>('/auth/login', payload);
    return res.data.data;
  },
  getMe: async () => {
    const res = await apiClient.get<{ success: boolean; data: AuthUser }>('/auth/me');
    return res.data.data;
  },
  refreshToken: async (refreshToken: string) => {
    const res = await apiClient.post<{ success: boolean; data: LoginResponseData }>('/auth/refresh', {
      refreshToken,
    });
    return res.data.data;
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    }
  },
};