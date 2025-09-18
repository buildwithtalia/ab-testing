import { Experiment } from '../types/experiment';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  experiment?: T;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all experiments
  async getAllExperiments(): Promise<Experiment[]> {
    return this.request<Experiment[]>('/experiments');
  }

  // Get experiment by ID
  async getExperiment(id: string): Promise<Experiment> {
    return this.request<Experiment>(`/experiments/${id}`);
  }

  // Start an experiment
  async startExperiment(id: string): Promise<ApiResponse<Experiment>> {
    return this.request<ApiResponse<Experiment>>(`/experiments/${id}/start`, {
      method: 'POST',
    });
  }

  // Stop an experiment
  async stopExperiment(id: string): Promise<ApiResponse<Experiment>> {
    return this.request<ApiResponse<Experiment>>(`/experiments/${id}/stop`, {
      method: 'POST',
    });
  }

  // Create a new experiment
  async createExperiment(experimentData: {
    name: string;
    description: string;
    variants: Array<{
      name: string;
      trafficPercentage: number;
    }>;
  }): Promise<ApiResponse<Experiment>> {
    return this.request<ApiResponse<Experiment>>('/experiments', {
      method: 'POST',
      body: JSON.stringify(experimentData),
    });
  }

  // Update experiment status (generic)
  async updateExperimentStatus(id: string, status: Experiment['status']): Promise<ApiResponse<Experiment>> {
    return this.request<ApiResponse<Experiment>>(`/experiments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Update experiment
  async updateExperiment(id: string, experimentData: Partial<{
    name: string;
    description: string;
    status: Experiment['status'];
    variants: Array<{
      name: string;
      weight?: number;
      trafficPercentage?: number;
      config?: Record<string, any>;
    }>;
    targetingRules: any[];
    startDate: string | Date;
    endDate: string | Date;
  }>): Promise<Experiment> {
    return this.request<Experiment>(`/experiments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(experimentData),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; experimentsCount: number }> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
export default apiService;