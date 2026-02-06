import axios from 'axios';
import { Company, Stats, Filters, CompaniesResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const companyService = {
  // Get all companies with pagination and filters
  getCompanies: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    industry?: string;
    priority?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<CompaniesResponse> => {
    const response = await api.get('/companies', { params });
    return response.data;
  },

  // Get single company
  getCompany: async (id: string): Promise<Company> => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  // Create new company
  createCompany: async (company: Omit<Company, '_id' | 'createdAt' | 'updatedAt'>): Promise<Company> => {
    const response = await api.post('/companies', company);
    return response.data;
  },

  // Update company
  updateCompany: async (id: string, company: Partial<Company>): Promise<Company> => {
    const response = await api.put(`/companies/${id}`, company);
    return response.data;
  },

  // Delete company
  deleteCompany: async (id: string): Promise<void> => {
    await api.delete(`/companies/${id}`);
  },
};

export const statsService = {
  // Get statistics
  getStats: async (): Promise<Stats> => {
    const response = await api.get('/stats');
    return response.data;
  },
};

export const filterService = {
  // Get filter options
  getFilters: async (): Promise<Filters> => {
    const response = await api.get('/filters');
    return response.data;
  },
};
