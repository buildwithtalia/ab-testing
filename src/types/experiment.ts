export interface Variant {
  id?: string;
  name: string;
  trafficPercentage?: number;
  weight?: number; // API uses 'weight' instead of 'trafficPercentage'
  conversions?: number;
  visitors?: number;
  config?: Record<string, any>; // API includes config object
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed';
  variants: Variant[];
  startDate?: Date | string;
  endDate?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ExperimentResults {
  experimentId: string;
  totalVisitors: number;
  totalConversions: number;
  conversionRate: number;
  uplift: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  isSignificant: boolean;
}