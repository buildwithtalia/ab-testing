import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, TrendingUp, Users } from 'lucide-react';
import { Experiment } from '../types/experiment';
import { ExperimentList } from './ExperimentList';
import { ExperimentForm } from './ExperimentForm';
import { ExperimentResults } from './ExperimentResults';
import { apiService } from '../services/api';

const mockExperiments: Experiment[] = [
  {
    id: '1',
    name: 'Homepage CTA Button Test',
    description: 'Testing different colors and text for the main CTA button',
    status: 'running',
    variants: [
      { id: 'a', name: 'Control (Blue)', trafficPercentage: 50, conversions: 45, visitors: 1000 },
      { id: 'b', name: 'Red Button', trafficPercentage: 50, conversions: 52, visitors: 1020 }
    ],
    startDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Pricing Page Layout',
    description: 'Testing different pricing table layouts',
    status: 'completed',
    variants: [
      { id: 'a', name: 'Original Layout', trafficPercentage: 33.33, conversions: 28, visitors: 800 },
      { id: 'b', name: 'Simplified Layout', trafficPercentage: 33.33, conversions: 35, visitors: 850 },
      { id: 'c', name: 'Feature Focused', trafficPercentage: 33.34, conversions: 42, visitors: 820 }
    ],
    startDate: new Date('2023-12-01'),
    endDate: new Date('2024-01-01'),
    createdAt: new Date('2023-11-25'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: 'Email Newsletter Signup',
    description: 'Testing different form designs for newsletter signup',
    status: 'draft',
    variants: [
      { id: 'a', name: 'Inline Form', trafficPercentage: 50, conversions: 0, visitors: 0 },
      { id: 'b', name: 'Modal Form', trafficPercentage: 50, conversions: 0, visitors: 0 }
    ],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
];

export const Dashboard: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [view, setView] = useState<'list' | 'create' | 'results'>('list');

  // Load experiments from API
  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllExperiments();
      setExperiments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load experiments');
      // Fallback to mock data if API fails
      console.warn('API failed, using mock data:', err);
      setExperiments(mockExperiments);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExperiment = async (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await apiService.createExperiment(experiment);
      await loadExperiments(); // Refresh the list
      setView('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create experiment');
    }
  };

  const handleUpdateExperimentStatus = async (id: string, status: Experiment['status']) => {
    try {
      let response;
      if (status === 'running') {
        response = await apiService.startExperiment(id);
      } else if (status === 'completed') {
        response = await apiService.stopExperiment(id);
      } else {
        response = await apiService.updateExperimentStatus(id, status);
      }
      
      if (response.success) {
        await loadExperiments(); // Refresh the list
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update experiment status');
    }
  };

  const handleViewResults = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setView('results');
  };

  const getTotalVisitors = () => {
    return experiments.reduce((total, exp) => {
      return total + exp.variants.reduce((variantTotal, variant) => variantTotal + (variant.visitors || 0), 0);
    }, 0);
  };

  const getTotalConversions = () => {
    return experiments.reduce((total, exp) => {
      return total + exp.variants.reduce((variantTotal, variant) => variantTotal + (variant.conversions || 0), 0);
    }, 0);
  };

  const getRunningExperiments = () => {
    return experiments.filter(exp => exp.status === 'running').length;
  };

  const getOverallConversionRate = () => {
    const totalVisitors = getTotalVisitors();
    const totalConversions = getTotalConversions();
    return totalVisitors > 0 ? ((totalConversions / totalVisitors) * 100).toFixed(2) : '0';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading experiments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container">
        <header className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">A/B Testing Dashboard</h1>
              <p className="text-gray-600">Manage and analyze your experiments</p>
            </div>
            <button 
              onClick={() => setView('create')}
              className="btn btn-primary"
            >
              <Plus size={16} />
              New Experiment
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">⚠️ {error}</p>
              <button 
                onClick={loadExperiments}
                className="text-red-600 underline text-sm mt-2"
              >
                Retry
              </button>
            </div>
          )}
        </header>

        {view === 'list' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Experiments</p>
                    <p className="text-2xl font-bold text-gray-900">{experiments.length}</p>
                  </div>
                  <BarChart3 className="text-blue-600" size={24} />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Running Experiments</p>
                    <p className="text-2xl font-bold text-gray-900">{getRunningExperiments()}</p>
                  </div>
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Visitors</p>
                    <p className="text-2xl font-bold text-gray-900">{getTotalVisitors().toLocaleString()}</p>
                  </div>
                  <Users className="text-purple-600" size={24} />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overall Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{getOverallConversionRate()}%</p>
                  </div>
                  <TrendingUp className="text-orange-600" size={24} />
                </div>
              </div>
            </div>

            <ExperimentList 
              experiments={experiments}
              onUpdateStatus={handleUpdateExperimentStatus}
              onViewResults={handleViewResults}
            />
          </>
        )}

        {view === 'create' && (
          <ExperimentForm 
            onSubmit={handleCreateExperiment}
            onCancel={() => setView('list')}
          />
        )}

        {view === 'results' && selectedExperiment && (
          <ExperimentResults 
            experiment={selectedExperiment}
            onBack={() => setView('list')}
          />
        )}
      </div>
    </div>
  );
};