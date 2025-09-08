import React from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Experiment } from '../types/experiment';

interface ExperimentResultsProps {
  experiment: Experiment;
  onBack: () => void;
}

export const ExperimentResults: React.FC<ExperimentResultsProps> = ({
  experiment,
  onBack
}) => {
  const calculateResults = () => {
    const controlVariant = experiment.variants[0];
    const results = experiment.variants.map((variant, index) => {
      const visitors = variant.visitors || 0;
      const conversions = variant.conversions || 0;
      const controlVisitors = controlVariant.visitors || 0;
      const controlConversions = controlVariant.conversions || 0;
      
      const conversionRate = visitors > 0 ? (conversions / visitors) * 100 : 0;
      const controlConversionRate = controlVisitors > 0 ? (controlConversions / controlVisitors) * 100 : 0;
      
      // Calculate uplift relative to control
      const uplift = index === 0 ? 0 : controlConversionRate > 0 ? ((conversionRate - controlConversionRate) / controlConversionRate) * 100 : 0;
      
      // Simple statistical significance calculation (simplified z-test)
      // In a real application, you'd want more sophisticated statistical analysis
      const isSignificant = Math.abs(uplift) > 5 && visitors > 100; // Simplified threshold
      
      // Mock confidence interval calculation
      const marginOfError = visitors > 0 ? Math.sqrt((conversionRate * (100 - conversionRate)) / visitors) * 1.96 : 0;
      
      return {
        ...variant,
        visitors,
        conversions,
        conversionRate,
        uplift,
        isSignificant,
        confidenceInterval: {
          lower: Math.max(0, conversionRate - marginOfError),
          upper: Math.min(100, conversionRate + marginOfError)
        }
      };
    });
    
    return results;
  };

  const results = calculateResults();
  const totalVisitors = results.reduce((sum, result) => sum + (result.visitors || 0), 0);
  const totalConversions = results.reduce((sum, result) => sum + (result.conversions || 0), 0);
  const overallConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;
  
  // Find the winning variant (highest conversion rate with statistical significance)
  const winningVariant = results.reduce((winner, current) => {
    if (!winner) return current;
    if (current.isSignificant && current.conversionRate > winner.conversionRate) {
      return current;
    }
    return winner;
  }, null as any);

  // Prepare chart data
  const chartData = results.map(result => ({
    name: result.name,
    conversionRate: parseFloat(result.conversionRate.toFixed(2)),
    visitors: result.visitors,
    conversions: result.conversions,
    uplift: parseFloat(result.uplift.toFixed(2))
  }));

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

  const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(dateObj);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn btn-secondary">
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <div>
            <h2 className="text-xl font-bold">{experiment.name}</h2>
            <p className="text-gray-600">{experiment.description}</p>
          </div>
        </div>
        <span className={getStatusBadge(experiment.status)}>
          {experiment.status}
        </span>
      </div>

      {/* Experiment Info */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Experiment Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Created:</span>
            <div className="font-medium">{formatDate(experiment.createdAt)}</div>
          </div>
          {experiment.startDate && (
            <div>
              <span className="text-gray-600">Started:</span>
              <div className="font-medium">{formatDate(experiment.startDate)}</div>
            </div>
          )}
          {experiment.endDate && (
            <div>
              <span className="text-gray-600">Ended:</span>
              <div className="font-medium">{formatDate(experiment.endDate)}</div>
            </div>
          )}
          <div>
            <span className="text-gray-600">Variants:</span>
            <div className="font-medium">{experiment.variants.length}</div>
          </div>
        </div>
      </div>

      {/* Overall Results */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{totalVisitors.toLocaleString()}</div>
          <div className="text-gray-600">Total Visitors</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{totalConversions.toLocaleString()}</div>
          <div className="text-gray-600">Total Conversions</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{overallConversionRate.toFixed(2)}%</div>
          <div className="text-gray-600">Overall Conversion Rate</div>
        </div>
      </div>

      {/* Winner Declaration */}
      {winningVariant && experiment.status === 'completed' && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-600" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Winner: {winningVariant.name}
              </h3>
              <p className="text-green-700">
                {winningVariant.conversionRate.toFixed(2)}% conversion rate 
                ({winningVariant.uplift > 0 ? '+' : ''}{winningVariant.uplift.toFixed(1)}% uplift)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Rate Chart */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={20} />
          <h3 className="text-lg font-semibold">Conversion Rates by Variant</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'conversionRate') return [`${value}%`, 'Conversion Rate'];
                  return [value, name];
                }}
              />
              <Bar dataKey="conversionRate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Results Table */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Detailed Results</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Variant</th>
                <th className="text-right py-3 px-4">Traffic %</th>
                <th className="text-right py-3 px-4">Visitors</th>
                <th className="text-right py-3 px-4">Conversions</th>
                <th className="text-right py-3 px-4">Conversion Rate</th>
                <th className="text-right py-3 px-4">Uplift</th>
                <th className="text-center py-3 px-4">Confidence Interval</th>
                <th className="text-center py-3 px-4">Significance</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">
                    {result.name}
                    {index === 0 && (
                      <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        Control
                      </span>
                    )}
                  </td>
                  <td className="text-right py-3 px-4">{result.trafficPercentage}%</td>
                  <td className="text-right py-3 px-4">{result.visitors.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">{result.conversions.toLocaleString()}</td>
                  <td className="text-right py-3 px-4 font-medium">
                    {result.conversionRate.toFixed(2)}%
                  </td>
                  <td className="text-right py-3 px-4">
                    {index === 0 ? (
                      <span className="text-gray-500">-</span>
                    ) : (
                      <div className={`flex items-center justify-end gap-1 ${
                        result.uplift > 0 ? 'text-green-600' : result.uplift < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {result.uplift > 0 ? (
                          <TrendingUp size={14} />
                        ) : result.uplift < 0 ? (
                          <TrendingDown size={14} />
                        ) : null}
                        {result.uplift > 0 ? '+' : ''}{result.uplift.toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td className="text-center py-3 px-4 text-sm">
                    {result.confidenceInterval.lower.toFixed(1)}% - {result.confidenceInterval.upper.toFixed(1)}%
                  </td>
                  <td className="text-center py-3 px-4">
                    {result.isSignificant ? (
                      <div className="flex items-center justify-center gap-1 text-green-600">
                        <CheckCircle size={14} />
                        <span className="text-xs">Yes</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-gray-500">
                        <AlertCircle size={14} />
                        <span className="text-xs">No</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistical Notes */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-1" size={20} />
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Statistical Notes</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Confidence intervals shown are 95% confidence levels</li>
              <li>• Statistical significance is determined by a simplified threshold (&gt;5% uplift with &gt;100 visitors)</li>
              <li>• For production use, consider implementing proper statistical significance testing</li>
              <li>• Ensure sufficient sample sizes before making decisions based on these results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};