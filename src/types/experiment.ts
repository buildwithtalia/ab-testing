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
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
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