export interface Variant {
  id: string;
  name: string;
  trafficPercentage: number;
  conversions: number;
  visitors: number;
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