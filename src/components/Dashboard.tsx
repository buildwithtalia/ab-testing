import React, { useState } from 'react';
import { Plus, BarChart3, TrendingUp, Users } from 'lucide-react';
import { Experiment } from '../types/experiment';
import { ExperimentList } from './ExperimentList';
import { ExperimentForm } from './ExperimentForm';
import { ExperimentResults } from './ExperimentResults';

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
  const [experiments, setExperiments] = useState<Experiment[]>(mockExperiments);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [view, setView] = useState<'list' | 'create' | 'results'>('list');

  const handleCreateExperiment = (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newExperiment: Experiment = {
      ...experiment,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setExperiments([...experiments, newExperiment]);
    setView('list');
    setShowCreateForm(false);
  };

  const handleUpdateExperimentStatus = (id: string, status: Experiment['status']) => {
    setExperiments(experiments.map(exp => 
      exp.id === id 
        ? { ...exp, status, updatedAt: new Date(), ...(status === 'running' ? { startDate: new Date() } : status === 'completed' ? { endDate: new Date() } : {}) }
        : exp
    ));
  };

  const handleViewResults = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    setView('results');
  };

  const getTotalVisitors = () => {
    return experiments.reduce((total, exp) => {
      return total + exp.variants.reduce((variantTotal, variant) => variantTotal + variant.visitors, 0);
    }, 0);
  };

  const getTotalConversions = () => {
    return experiments.reduce((total, exp) => {
      return total + exp.variants.reduce((variantTotal, variant) => variantTotal + variant.conversions, 0);
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