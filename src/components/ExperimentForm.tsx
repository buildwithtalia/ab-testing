import React, { useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { Experiment, Variant, SegmentationRule } from '../types/experiment';

interface ExperimentFormProps {
  onSubmit: (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  experiment?: Experiment;
}

export const ExperimentForm: React.FC<ExperimentFormProps> = ({
  onSubmit,
  onCancel,
  experiment
}) => {
  const [name, setName] = useState(experiment?.name || '');
  const [description, setDescription] = useState(experiment?.description || '');
  const [variants, setVariants] = useState<Omit<Variant, 'conversions' | 'visitors'>[]>(
    experiment?.variants.map(v => ({
      id: v.id,
      name: v.name,
      trafficPercentage: v.trafficPercentage
    })) || [
      { id: 'a', name: 'Control', trafficPercentage: 50 },
      { id: 'b', name: 'Variant B', trafficPercentage: 50 }
    ]
  );
  
  const [segmentationRules, setSegmentationRules] = useState<SegmentationRule[]>(
    experiment?.segmentationRules || []
  );
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const addVariant = () => {
    const newId = String.fromCharCode(97 + variants.length); // a, b, c, d...
    const newVariants = [...variants, {
      id: newId,
      name: `Variant ${newId.toUpperCase()}`,
      trafficPercentage: 0
    }];
    
    // Redistribute traffic evenly
    const evenPercentage = Math.floor(100 / newVariants.length);
    const remainder = 100 - (evenPercentage * newVariants.length);
    
    newVariants.forEach((variant, index) => {
      variant.trafficPercentage = evenPercentage + (index < remainder ? 1 : 0);
    });
    
    setVariants(newVariants);
  };

  const removeVariant = (id: string) => {
    if (variants.length <= 2) return; // Don't allow removing if only 2 variants
    
    const newVariants = variants.filter(v => v.id !== id);
    
    // Redistribute traffic evenly
    const evenPercentage = Math.floor(100 / newVariants.length);
    const remainder = 100 - (evenPercentage * newVariants.length);
    
    newVariants.forEach((variant, index) => {
      variant.trafficPercentage = evenPercentage + (index < remainder ? 1 : 0);
    });
    
    setVariants(newVariants);
  };

  const updateVariant = (id: string, field: keyof Omit<Variant, 'conversions' | 'visitors'>, value: string | number) => {
    setVariants(variants.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const updateTrafficPercentage = (id: string, percentage: number) => {
    const newVariants = variants.map(v => 
      v.id === id ? { ...v, trafficPercentage: percentage } : v
    );
    setVariants(newVariants);
  };

  const balanceTraffic = () => {
    const evenPercentage = Math.floor(100 / variants.length);
    const remainder = 100 - (evenPercentage * variants.length);
    
    const newVariants = variants.map((variant, index) => ({
      ...variant,
      trafficPercentage: evenPercentage + (index < remainder ? 1 : 0)
    }));
    
    setVariants(newVariants);
  };

  // Segmentation rule management
  const addSegmentationRule = () => {
    setSegmentationRules([
      ...segmentationRules,
      { field: '', operator: 'equals', value: '' }
    ]);
  };

  const removeSegmentationRule = (index: number) => {
    setSegmentationRules(segmentationRules.filter((_, i) => i !== index));
  };

  const updateSegmentationRule = (index: number, field: keyof SegmentationRule, value: any) => {
    const newRules = [...segmentationRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setSegmentationRules(newRules);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Experiment name is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    const totalPercentage = variants.reduce((sum, v) => sum + (v.trafficPercentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      newErrors.traffic = 'Traffic percentages must sum to 100%';
    }
    
    variants.forEach((variant, index) => {
      if (!variant.name.trim()) {
        newErrors[`variant_${index}_name`] = 'Variant name is required';
      }
    });

    // Validate segmentation rules
    segmentationRules.forEach((rule, index) => {
      if (!rule.field.trim()) {
        newErrors[`segment_${index}_field`] = 'Field is required';
      }
      if (!rule.value || (Array.isArray(rule.value) && rule.value.length === 0)) {
        newErrors[`segment_${index}_value`] = 'Value is required';
      }
      if (['in', 'not_in'].includes(rule.operator) && !Array.isArray(rule.value)) {
        newErrors[`segment_${index}_value`] = 'Array value required for this operator';
      }
      if (['greater_than', 'less_than'].includes(rule.operator) && isNaN(Number(rule.value))) {
        newErrors[`segment_${index}_value`] = 'Numeric value required for this operator';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const experimentData: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      description: description.trim(),
      status: 'draft',
      variants: variants.map(v => ({
        ...v,
        conversions: 0,
        visitors: 0
      })),
      segmentationRules: segmentationRules.length > 0 ? segmentationRules : undefined
    };
    
    onSubmit(experimentData);
  };

  const totalPercentage = variants.reduce((sum, v) => sum + (v.trafficPercentage || 0), 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          {experiment ? 'Edit Experiment' : 'Create New Experiment'}
        </h2>
        <button onClick={onCancel} className="btn btn-secondary">
          <X size={16} />
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-group">
          <label className="form-label">Experiment Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder="e.g., Homepage CTA Button Test"
          />
          {errors.name && (
            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
              <AlertCircle size={14} />
              {errors.name}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-textarea"
            placeholder="Describe what you're testing and your hypothesis..."
          />
          {errors.description && (
            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
              <AlertCircle size={14} />
              {errors.description}
            </div>
          )}
        </div>

        <div className="form-group">
          <div className="flex items-center justify-between mb-4">
            <label className="form-label mb-0">Variants</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={balanceTraffic}
                className="btn btn-secondary text-sm"
              >
                Balance Traffic
              </button>
              <button
                type="button"
                onClick={addVariant}
                className="btn btn-primary text-sm"
                disabled={variants.length >= 5}
              >
                <Plus size={14} />
                Add Variant
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div key={variant.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Variant {(variant.id || String.fromCharCode(65 + index)).toUpperCase()}</h4>
                  {variants.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id || '')}
                      className="btn btn-danger text-sm"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Variant Name</label>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => updateVariant(variant.id || '', 'name', e.target.value)}
                      className="form-input"
                      placeholder="e.g., Control, Red Button"
                    />
                    {errors[`variant_${index}_name`] && (
                      <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                        <AlertCircle size={14} />
                        {errors[`variant_${index}_name`]}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Traffic Percentage</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={variant.trafficPercentage}
                        onChange={(e) => updateTrafficPercentage(variant.id || '', parseFloat(e.target.value) || 0)}
                        className="form-input"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total Traffic Allocation:</span>
              <span className={`font-bold ${Math.abs(totalPercentage - 100) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                {totalPercentage.toFixed(1)}%
              </span>
            </div>
            {Math.abs(totalPercentage - 100) > 0.01 && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle size={14} />
                Traffic percentages must sum to exactly 100%
              </div>
            )}
          </div>

          {errors.traffic && (
            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
              <AlertCircle size={14} />
              {errors.traffic}
            </div>
          )}
        </div>

        {/* Segmentation Rules Section */}
        <div className="form-group">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="form-label mb-0">Segmentation Rules</label>
              <p className="text-sm text-gray-600 mt-1">
                Define criteria to target specific users. All rules must match for user eligibility.
              </p>
            </div>
            <button
              type="button"
              onClick={addSegmentationRule}
              className="btn btn-primary text-sm"
            >
              <Plus size={14} />
              Add Rule
            </button>
          </div>

          {segmentationRules.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
              <p>No segmentation rules defined. All users will be eligible for this experiment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {segmentationRules.map((rule, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Rule {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeSegmentationRule(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Field</label>
                      <input
                        type="text"
                        value={rule.field}
                        onChange={(e) => updateSegmentationRule(index, 'field', e.target.value)}
                        className="form-input"
                        placeholder="e.g., country, device, age"
                      />
                      {errors[`segment_${index}_field`] && (
                        <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                          <AlertCircle size={14} />
                          {errors[`segment_${index}_field`]}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="form-label">Operator</label>
                      <select
                        value={rule.operator}
                        onChange={(e) => updateSegmentationRule(index, 'operator', e.target.value as SegmentationRule['operator'])}
                        className="form-input"
                      >
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not Equals</option>
                        <option value="in">In Array</option>
                        <option value="not_in">Not In Array</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="contains">Contains</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Value</label>
                      {['in', 'not_in'].includes(rule.operator) ? (
                        <input
                          type="text"
                          value={Array.isArray(rule.value) ? rule.value.join(', ') : ''}
                          onChange={(e) => {
                            const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                            updateSegmentationRule(index, 'value', values);
                          }}
                          className="form-input"
                          placeholder="value1, value2, value3"
                        />
                      ) : (
                        <input
                          type={['greater_than', 'less_than'].includes(rule.operator) ? 'number' : 'text'}
                          value={Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}
                          onChange={(e) => {
                            const value = ['greater_than', 'less_than'].includes(rule.operator) 
                              ? parseFloat(e.target.value) || 0
                              : e.target.value;
                            updateSegmentationRule(index, 'value', value);
                          }}
                          className="form-input"
                          placeholder={
                            ['greater_than', 'less_than'].includes(rule.operator) 
                              ? 'e.g., 18' 
                              : 'e.g., US, mobile'
                          }
                        />
                      )}
                      {errors[`segment_${index}_value`] && (
                        <div className="flex items-center gap-2 mt-1 text-red-600 text-sm">
                          <AlertCircle size={14} />
                          {errors[`segment_${index}_value`]}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                    <strong>Preview:</strong> {rule.field || 'field'} {rule.operator || 'operator'} {
                      Array.isArray(rule.value) 
                        ? `[${rule.value.join(', ')}]`
                        : rule.value || 'value'
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button type="submit" className="btn btn-primary">
            {experiment ? 'Update Experiment' : 'Create Experiment'}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};