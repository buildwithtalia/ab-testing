import React from 'react';
import { Play, Pause, Eye, Calendar, Users, TrendingUp } from 'lucide-react';
import { Experiment } from '../types/experiment';

interface ExperimentListProps {
  experiments: Experiment[];
  onUpdateStatus: (id: string, status: Experiment['status']) => void;
  onViewResults: (experiment: Experiment) => void;
}

export const ExperimentList: React.FC<ExperimentListProps> = ({
  experiments,
  onUpdateStatus,
  onViewResults
}) => {
  const getStatusBadge = (status: Experiment['status']) => {
    const baseClasses = 'status-badge';
    switch (status) {
      case 'draft':
        return `${baseClasses} status-draft`;
      case 'running':
        return `${baseClasses} status-running`;
      case 'completed':
        return `${baseClasses} status-completed`;
      default:
        return baseClasses;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getExperimentMetrics = (experiment: Experiment) => {
    const totalVisitors = experiment.variants.reduce((sum, variant) => sum + variant.visitors, 0);
    const totalConversions = experiment.variants.reduce((sum, variant) => sum + variant.conversions, 0);
    const conversionRate = totalVisitors > 0 ? ((totalConversions / totalVisitors) * 100) : 0;
    
    return {
      totalVisitors,
      totalConversions,
      conversionRate
    };
  };

  const canStart = (experiment: Experiment) => experiment.status === 'draft';
  const canPause = (experiment: Experiment) => experiment.status === 'running';
  const canComplete = (experiment: Experiment) => experiment.status === 'running';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Experiments</h2>
        <div className="flex gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Draft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Running</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Completed</span>
          </div>
        </div>
      </div>

      {experiments.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400 mb-4">
            <TrendingUp size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No experiments yet</h3>
          <p className="text-gray-600 mb-6">Create your first A/B test to get started</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {experiments.map((experiment) => {
            const metrics = getExperimentMetrics(experiment);
            
            return (
              <div key={experiment.id} className="card hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{experiment.name}</h3>
                      <span className={getStatusBadge(experiment.status)}>
                        {experiment.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{experiment.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Created: {formatDate(experiment.createdAt)}</span>
                      </div>
                      {experiment.startDate && (
                        <div className="flex items-center gap-1">
                          <Play size={14} />
                          <span>Started: {formatDate(experiment.startDate)}</span>
                        </div>
                      )}
                      {experiment.endDate && (
                        <div className="flex items-center gap-1">
                          <Pause size={14} />
                          <span>Ended: {formatDate(experiment.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {canStart(experiment) && (
                      <button
                        onClick={() => onUpdateStatus(experiment.id, 'running')}
                        className="btn btn-success text-sm"
                      >
                        <Play size={14} />
                        Start
                      </button>
                    )}
                    {canComplete(experiment) && (
                      <button
                        onClick={() => onUpdateStatus(experiment.id, 'completed')}
                        className="btn btn-secondary text-sm"
                      >
                        <Pause size={14} />
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => onViewResults(experiment)}
                      className="btn btn-primary text-sm"
                    >
                      <Eye size={14} />
                      View Results
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{metrics.totalVisitors.toLocaleString()}</div>
                      <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                        <Users size={14} />
                        Total Visitors
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{metrics.totalConversions.toLocaleString()}</div>
                      <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                        <TrendingUp size={14} />
                        Total Conversions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{metrics.conversionRate.toFixed(2)}%</div>
                      <div className="text-sm text-gray-600">Conversion Rate</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Variants ({experiment.variants.length})</h4>
                    <div className="grid gap-2">
                      {experiment.variants.map((variant) => {
                        const variantConversionRate = variant.visitors > 0 
                          ? ((variant.conversions / variant.visitors) * 100) 
                          : 0;
                          
                        return (
                          <div key={variant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="font-medium">{variant.name}</div>
                              <div className="text-sm text-gray-600">
                                {variant.trafficPercentage}% traffic
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>{variant.visitors.toLocaleString()} visitors</span>
                              <span>{variant.conversions.toLocaleString()} conversions</span>
                              <span className="font-medium">{variantConversionRate.toFixed(2)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};