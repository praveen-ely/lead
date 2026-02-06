import axios from 'axios';
import { User, UserStats, UserFilters, UsersResponse } from '../types/user';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const userService = {
  // Get all users with pagination and filters
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    status?: string;
    workType?: string;
    city?: string;
    state?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<UsersResponse> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get single user
  getUser: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (user: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const response = await api.post('/users', user);
    return response.data;
  },

  // Update user
  updateUser: async (id: string, user: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, user);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

export const userStatsService = {
  // Get user statistics
  getStats: async (): Promise<UserStats> => {
    const response = await api.get('/user-stats');
    return response.data;
  },
};

export const userFilterService = {
  // Get user filter options
  getFilters: async (): Promise<UserFilters> => {
    const response = await api.get('/user-filters');
    return response.data;
  },
};
