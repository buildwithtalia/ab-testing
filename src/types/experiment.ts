export interface SegmentationRule {
  field: string; // e.g., 'country', 'device', 'age', 'premium'
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains';
  value: string | number | (string | number)[];
}

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
  segmentationRules?: SegmentationRule[];
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