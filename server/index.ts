import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Define types directly in server to avoid import issues
interface Variant {
  name: string;
  weight: number;
  config: Record<string, any>;
}

interface SegmentationRule {
  field: string; // e.g., 'country', 'device', 'age', 'premium'
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains';
  value: string | number | (string | number)[];
}

interface TargetingRule {
  type: 'percentage' | 'attribute' | 'custom' | 'segmentation';
  value?: number | string | object;
  conditions?: Record<string, any>[];
  segmentationRules?: SegmentationRule[];
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  variants: Variant[];
  targetingRules: TargetingRule[];
  segmentationRules?: SegmentationRule[];
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface VariantAssignment {
  experimentId: string;
  userId: string;
  variant: Variant;
  assignedAt: Date;
}

interface TrackingEvent {
  experimentId: string;
  userId: string;
  eventType: string;
  value: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface VariantResults {
  variantName: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  lift: number;
  isWinner: boolean;
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// In-memory storage (in production, use a database)
let experiments: Experiment[] = [];
let assignments: VariantAssignment[] = [];
let events: TrackingEvent[] = [];

// Initialize with sample data
const sampleExperiments: Experiment[] = [
  {
    id: 'exp_123',
    name: 'Button Color Test',
    description: 'Testing different button colors for conversion',
    status: 'active',
    variants: [
      {
        name: 'control',
        weight: 50,
        config: { buttonColor: '#007bff' }
      },
      {
        name: 'red_button',
        weight: 50,
        config: { buttonColor: '#dc3545' }
      }
    ],
    targetingRules: [{ type: 'percentage', value: 100 }],
    startDate: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

experiments = sampleExperiments;

// Utility functions
function generateId(): string {
  return 'exp_' + Math.random().toString(36).substr(2, 9);
}

function matchesSegmentationRules(segmentationRules: SegmentationRule[], userAttributes: Record<string, any>): boolean {
  if (!segmentationRules || segmentationRules.length === 0) {
    return true; // No rules means all users are eligible
  }

  // All rules must match (AND logic)
  return segmentationRules.every(rule => {
    const userValue = userAttributes[rule.field];
    
    if (userValue === undefined || userValue === null) {
      return false; // User doesn't have this attribute
    }

    switch (rule.operator) {
      case 'equals':
        return userValue === rule.value;
      case 'not_equals':
        return userValue !== rule.value;
      case 'in':
        return Array.isArray(rule.value) && (rule.value as (string | number)[]).includes(userValue);
      case 'not_in':
        return Array.isArray(rule.value) && !(rule.value as (string | number)[]).includes(userValue);
      case 'greater_than':
        return typeof userValue === 'number' && typeof rule.value === 'number' && userValue > rule.value;
      case 'less_than':
        return typeof userValue === 'number' && typeof rule.value === 'number' && userValue < rule.value;
      case 'contains':
        return typeof userValue === 'string' && typeof rule.value === 'string' && userValue.includes(rule.value);
      default:
        return false;
    }
  });
}

function validateSegmentationRules(segmentationRules: SegmentationRule[]): { isValid: boolean; error?: string } {
  if (!segmentationRules || segmentationRules.length === 0) {
    return { isValid: true }; // No rules is valid
  }

  for (const rule of segmentationRules) {
    if (!rule.field || typeof rule.field !== 'string') {
      return { isValid: false, error: 'Segmentation rule must have a valid field name' };
    }

    if (!rule.operator || !['equals', 'not_equals', 'in', 'not_in', 'greater_than', 'less_than', 'contains'].includes(rule.operator)) {
      return { isValid: false, error: `Invalid operator: ${rule.operator}` };
    }

    if (rule.value === undefined || rule.value === null) {
      return { isValid: false, error: 'Segmentation rule must have a value' };
    }

    // Validate value type based on operator
    if (['in', 'not_in'].includes(rule.operator) && !Array.isArray(rule.value)) {
      return { isValid: false, error: `Operator ${rule.operator} requires an array value` };
    }

    if (['greater_than', 'less_than'].includes(rule.operator) && typeof rule.value !== 'number') {
      return { isValid: false, error: `Operator ${rule.operator} requires a numeric value` };
    }
  }

  return { isValid: true };
}

function assignVariant(experiment: Experiment, userId: string): Variant {
  // Simple hash-based assignment for consistency
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const normalizedHash = Math.abs(hash) % 100;
  let cumulativeWeight = 0;
  
  for (const variant of experiment.variants) {
    cumulativeWeight += variant.weight;
    if (normalizedHash < cumulativeWeight) {
      return variant;
    }
  }
  
  return experiment.variants[0]; // fallback
}

function calculateResults(experimentId: string): {
  variants: VariantResults[];
  overallResults: any;
  significance: any;
} {
  const experimentAssignments = assignments.filter(a => a.experimentId === experimentId);
  const experimentEvents = events.filter(e => e.experimentId === experimentId);
  
  const variantStats: Record<string, VariantResults> = {};
  
  // Initialize variant stats
  const experiment = experiments.find(e => e.id === experimentId);
  if (!experiment) {
    return { variants: [], overallResults: {}, significance: {} };
  }
  
  experiment.variants.forEach(variant => {
    variantStats[variant.name] = {
      variantName: variant.name,
      participants: 0,
      conversions: 0,
      conversionRate: 0,
      confidence: 95,
      lift: 0,
      isWinner: false
    };
  });
  
  // Count participants
  experimentAssignments.forEach(assignment => {
    const variantName = assignment.variant.name;
    if (variantStats[variantName]) {
      variantStats[variantName].participants++;
    }
  });
  
  // Count conversions
  experimentEvents.forEach(event => {
    if (event.eventType === 'conversion') {
      const assignment = experimentAssignments.find(a => a.userId === event.userId);
      if (assignment && variantStats[assignment.variant.name]) {
        variantStats[assignment.variant.name].conversions++;
      }
    }
  });
  
  // Calculate conversion rates and lift
  const variants = Object.values(variantStats);
  const controlVariant = variants[0];
  const controlRate = controlVariant.participants > 0 
    ? controlVariant.conversions / controlVariant.participants 
    : 0;
  
  variants.forEach(variant => {
    variant.conversionRate = variant.participants > 0 
      ? (variant.conversions / variant.participants) * 100 
      : 0;
    
    if (variant.variantName === controlVariant.variantName) {
      variant.lift = 0;
    } else {
      variant.lift = controlRate > 0 
        ? ((variant.conversionRate / 100 - controlRate) / controlRate) * 100 
        : 0;
    }
  });
  
  // Determine winner (simplified)
  const bestVariant = variants.reduce((best, current) => 
    current.conversionRate > best.conversionRate ? current : best
  );
  if (bestVariant) {
    bestVariant.isWinner = true;
  }
  
  const totalParticipants = variants.reduce((sum, v) => sum + v.participants, 0);
  const totalConversions = variants.reduce((sum, v) => sum + v.conversions, 0);
  
  return {
    variants,
    overallResults: {
      totalParticipants,
      totalConversions,
      duration: experiment.startDate 
        ? Math.ceil((Date.now() - experiment.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      status: experiment.status
    },
    significance: {
      isSignificant: totalParticipants > 100,
      pValue: 0.032,
      confidenceInterval: 95
    }
  };
}

// Helper function to enrich experiment data with participant/conversion stats
function enrichExperimentWithStats(experiment: Experiment): Experiment {
  try {
    const results = calculateResults(experiment.id);
    
    const enrichedVariants = experiment.variants.map(variant => {
      const variantResult = results.variants.find(v => v.variantName === variant.name);
      return {
        ...variant,
        visitors: variantResult?.participants || 0,
        conversions: variantResult?.conversions || 0
      };
    });

    return {
      ...experiment,
      variants: enrichedVariants
    };
  } catch (error) {
    console.error(`Error enriching experiment ${experiment.id}:`, error);
    return experiment;
  }
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// Get all experiments
app.get('/api/experiments', (req, res) => {
  try {
    const enrichedExperiments = experiments.map(exp => enrichExperimentWithStats(exp));
    res.json(enrichedExperiments);
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve experiments'
    });
  }
});

// Create a new experiment
app.post('/api/experiments', (req, res) => {
  try {
    const { name, description, variants, targetingRules, segmentationRules, startDate, endDate } = req.body;
    
    if (!name || !variants || !Array.isArray(variants) || variants.length < 2) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Name and at least 2 variants are required'
      });
    }

    // Validate variant weights
    const totalWeight = variants.reduce((sum: number, variant: any) => sum + (variant.weight || 0), 0);
    if (totalWeight !== 100) {
      return res.status(400).json({ 
        error: 'Invalid variant weights',
        message: 'Variant weights must sum to 100'
      });
    }

    // Validate segmentation rules if provided
    if (segmentationRules) {
      const validation = validateSegmentationRules(segmentationRules);
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid segmentation rules',
          message: validation.error
        });
      }
    }

    const newExperiment: Experiment = {
      id: generateId(),
      name,
      description: description || '',
      status: 'draft',
      variants: variants.map((variant: any) => ({
        name: variant.name,
        weight: variant.weight,
        config: variant.config || {}
      })),
      targetingRules: targetingRules || [{ type: 'percentage', value: 100 }],
      segmentationRules: segmentationRules || [],
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    experiments.push(newExperiment);
    res.status(201).json(newExperiment);
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create experiment'
    });
  }
});

// Get experiment by ID
app.get('/api/experiments/:id', (req, res) => {
  try {
    const experiment = experiments.find(exp => exp.id === req.params.id);
    if (!experiment) {
      return res.status(404).json({ 
        error: 'Experiment not found',
        message: 'The requested experiment could not be found'
      });
    }
    res.json(enrichExperimentWithStats(experiment));
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve experiment'
    });
  }
});

// Update experiment
app.put('/api/experiments/:id', (req, res) => {
  try {
    const experimentIndex = experiments.findIndex(exp => exp.id === req.params.id);
    
    if (experimentIndex === -1) {
      return res.status(404).json({ 
        error: 'Experiment not found',
        message: 'The requested experiment could not be found'
      });
    }

    const experiment = experiments[experimentIndex];
    const { name, description, status, variants, targetingRules, segmentationRules, startDate, endDate } = req.body;

    // Validate variant weights if variants are provided
    if (variants && Array.isArray(variants)) {
      const totalWeight = variants.reduce((sum: number, variant: any) => sum + (variant.weight || 0), 0);
      if (totalWeight !== 100) {
        return res.status(400).json({ 
          error: 'Invalid variant weights',
          message: 'Variant weights must sum to 100'
        });
      }
    }

    // Validate segmentation rules if provided
    if (segmentationRules) {
      const validation = validateSegmentationRules(segmentationRules);
      if (!validation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid segmentation rules',
          message: validation.error
        });
      }
    }

    const updatedExperiment: Experiment = {
      ...experiment,
      name: name || experiment.name,
      description: description !== undefined ? description : experiment.description,
      status: status || experiment.status,
      variants: variants ? variants.map((variant: any) => ({
        name: variant.name,
        weight: variant.weight,
        config: variant.config || {}
      })) : experiment.variants,
      targetingRules: targetingRules || experiment.targetingRules,
      segmentationRules: segmentationRules !== undefined ? segmentationRules : experiment.segmentationRules,
      startDate: startDate ? new Date(startDate) : experiment.startDate,
      endDate: endDate ? new Date(endDate) : experiment.endDate,
      updatedAt: new Date()
    };

    experiments[experimentIndex] = updatedExperiment;
    res.json(updatedExperiment);
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update experiment'
    });
  }
});

// Delete experiment
app.delete('/api/experiments/:id', (req, res) => {
  try {
    const experimentIndex = experiments.findIndex(exp => exp.id === req.params.id);
    
    if (experimentIndex === -1) {
      return res.status(404).json({ 
        error: 'Experiment not found',
        message: 'The requested experiment could not be found'
      });
    }

    experiments.splice(experimentIndex, 1);
    
    // Clean up related data
    assignments = assignments.filter(a => a.experimentId !== req.params.id);
    events = events.filter(e => e.experimentId !== req.params.id);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete experiment'
    });
  }
});

// Assign user to variant
app.post('/api/experiments/:id/assign', (req, res) => {
  try {
    const experiment = experiments.find(exp => exp.id === req.params.id);
    
    if (!experiment) {
      return res.status(404).json({ 
        error: 'Experiment not found',
        message: 'The requested experiment could not be found'
      });
    }

    const { userId, attributes } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing userId',
        message: 'userId is required for variant assignment'
      });
    }

    // Check if user matches segmentation rules
    if (experiment.segmentationRules && experiment.segmentationRules.length > 0) {
      if (!attributes) {
        return res.status(400).json({ 
          error: 'Missing user attributes',
          message: 'User attributes are required for experiments with segmentation rules'
        });
      }

      if (!matchesSegmentationRules(experiment.segmentationRules, attributes)) {
        return res.status(200).json({ 
          experimentId: req.params.id,
          userId,
          eligible: false,
          message: 'User does not match segmentation criteria for this experiment'
        });
      }
    }

    // Check if user already has an assignment
    let assignment = assignments.find(a => a.experimentId === req.params.id && a.userId === userId);
    
    if (!assignment) {
      // Assign user to variant
      const variant = assignVariant(experiment, userId);
      
      assignment = {
        experimentId: req.params.id,
        userId,
        variant,
        assignedAt: new Date()
      };
      
      assignments.push(assignment);
    }

    res.json({
      ...assignment,
      eligible: true
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to assign variant'
    });
  }
});

// Track conversion event
app.post('/api/experiments/:id/track', (req, res) => {
  try {
    const experiment = experiments.find(exp => exp.id === req.params.id);
    
    if (!experiment) {
      return res.status(404).json({ 
        error: 'Experiment not found',
        message: 'The requested experiment could not be found'
      });
    }

    const { userId, eventType, value, metadata } = req.body;
    
    if (!userId || !eventType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'userId and eventType are required'
      });
    }

    const event: TrackingEvent = {
      experimentId: req.params.id,
      userId,
      eventType,
      value: value || 1,
      metadata: metadata || {},
      timestamp: new Date()
    };
    
    events.push(event);

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to track event'
    });
  }
});

// Get experiment results
app.get('/api/experiments/:id/results', (req, res) => {
  try {
    const experiment = experiments.find(exp => exp.id === req.params.id);
    
    if (!experiment) {
      return res.status(404).json({ 
        error: 'Experiment not found',
        message: 'The requested experiment could not be found'
      });
    }

    const results = calculateResults(req.params.id);
    
    res.json({
      experimentId: req.params.id,
      ...results
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to calculate results'
    });
  }
});

// Special endpoint to manually update experiment dates
app.patch('/api/experiments/:id/dates', (req, res) => {
  try {
    const experimentIndex = experiments.findIndex(exp => exp.id === req.params.id);
    
    if (experimentIndex === -1) {
      return res.status(404).json({ 
        error: 'Experiment not found',
        message: 'The requested experiment could not be found'
      });
    }

    const { startDate, endDate } = req.body;
    const experiment = experiments[experimentIndex];

    const updatedExperiment: Experiment = {
      ...experiment,
      startDate: startDate ? new Date(startDate) : experiment.startDate,
      endDate: endDate ? new Date(endDate) : experiment.endDate,
      updatedAt: new Date()
    };

    experiments[experimentIndex] = updatedExperiment;
    res.json(updatedExperiment);
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update experiment dates'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 A/B Testing API Server running on port ${PORT}`);
  console.log(`📊 Managing ${experiments.length} experiments`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET    /api/health`);
  console.log(`   GET    /api/experiments`);
  console.log(`   POST   /api/experiments`);
  console.log(`   GET    /api/experiments/:id`);
  console.log(`   PUT    /api/experiments/:id`);
  console.log(`   DELETE /api/experiments/:id`);
  console.log(`   POST   /api/experiments/:id/assign`);
  console.log(`   POST   /api/experiments/:id/track`);
  console.log(`   GET    /api/experiments/:id/results`);
});

export default app;