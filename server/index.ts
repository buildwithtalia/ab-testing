import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
// Define types directly in server to avoid import issues
interface Variant {
  id: string;
  name: string;
  trafficPercentage: number;
  conversions: number;
  visitors: number;
}

interface Experiment {
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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// In-memory storage for experiments (in production, use a database)
let experiments: Experiment[] = [];

// Initialize with sample data
const sampleExperiments: Experiment[] = [
  {
    id: '1',
    name: 'Homepage CTA Button Test',
    description: 'Testing blue vs red CTA button color on homepage',
    status: 'draft',
    variants: [
      {
        id: 'variant-1',
        name: 'Control (Blue)',
        trafficPercentage: 50,
        conversions: 0,
        visitors: 0
      },
      {
        id: 'variant-2',
        name: 'Treatment (Red)',
        trafficPercentage: 50,
        conversions: 0,
        visitors: 0
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Pricing Page Layout',
    description: 'Testing different pricing table layouts',
    status: 'running',
    variants: [
      {
        id: 'variant-3',
        name: 'Current Layout',
        trafficPercentage: 33.33,
        conversions: 145,
        visitors: 1520
      },
      {
        id: 'variant-4',
        name: 'Simplified Layout',
        trafficPercentage: 33.33,
        conversions: 167,
        visitors: 1489
      },
      {
        id: 'variant-5',
        name: 'Feature-focused Layout',
        trafficPercentage: 33.34,
        conversions: 158,
        visitors: 1501
      }
    ],
    startDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15')
  }
];

experiments = sampleExperiments;

// API Routes

// Get all experiments
app.get('/api/experiments', (req, res) => {
  res.json(experiments);
});

// Get experiment by ID
app.get('/api/experiments/:id', (req, res) => {
  const experiment = experiments.find(exp => exp.id === req.params.id);
  if (!experiment) {
    return res.status(404).json({ error: 'Experiment not found' });
  }
  res.json(experiment);
});

// Start an experiment
app.post('/api/experiments/:id/start', (req, res) => {
  const experimentId = req.params.id;
  const experimentIndex = experiments.findIndex(exp => exp.id === experimentId);
  
  if (experimentIndex === -1) {
    return res.status(404).json({ error: 'Experiment not found' });
  }

  const experiment = experiments[experimentIndex];
  
  // Validate that experiment can be started
  if (experiment.status !== 'draft') {
    return res.status(400).json({ 
      error: 'Experiment cannot be started. Current status: ' + experiment.status 
    });
  }

  // Validate that variants have proper traffic allocation
  const totalTraffic = experiment.variants.reduce((sum, variant) => sum + variant.trafficPercentage, 0);
  if (Math.abs(totalTraffic - 100) > 0.01) {
    return res.status(400).json({ 
      error: 'Traffic allocation must equal 100%. Current total: ' + totalTraffic + '%' 
    });
  }

  // Start the experiment
  experiments[experimentIndex] = {
    ...experiment,
    status: 'running',
    startDate: new Date(),
    updatedAt: new Date()
  };

  res.json({
    success: true,
    message: 'Experiment started successfully',
    experiment: experiments[experimentIndex]
  });
});

// Stop an experiment
app.post('/api/experiments/:id/stop', (req, res) => {
  const experimentId = req.params.id;
  const experimentIndex = experiments.findIndex(exp => exp.id === experimentId);
  
  if (experimentIndex === -1) {
    return res.status(404).json({ error: 'Experiment not found' });
  }

  const experiment = experiments[experimentIndex];
  
  // Validate that experiment can be stopped
  if (experiment.status !== 'running') {
    return res.status(400).json({ 
      error: 'Experiment cannot be stopped. Current status: ' + experiment.status 
    });
  }

  // Stop the experiment
  experiments[experimentIndex] = {
    ...experiment,
    status: 'completed',
    endDate: new Date(),
    updatedAt: new Date()
  };

  res.json({
    success: true,
    message: 'Experiment stopped successfully',
    experiment: experiments[experimentIndex]
  });
});

// Create a new experiment
app.post('/api/experiments', (req, res) => {
  const { name, description, variants } = req.body;
  
  if (!name || !description || !variants || !Array.isArray(variants)) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, description, and variants' 
    });
  }

  const newExperiment: Experiment = {
    id: Date.now().toString(),
    name,
    description,
    status: 'draft',
    variants: variants.map((variant: any, index: number) => ({
      id: `variant-${Date.now()}-${index}`,
      name: variant.name,
      trafficPercentage: variant.trafficPercentage || 0,
      conversions: 0,
      visitors: 0
    })),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  experiments.push(newExperiment);
  
  res.status(201).json({
    success: true,
    message: 'Experiment created successfully',
    experiment: newExperiment
  });
});

// Update experiment status (generic endpoint)
app.patch('/api/experiments/:id/status', (req, res) => {
  const experimentId = req.params.id;
  const { status } = req.body;
  const experimentIndex = experiments.findIndex(exp => exp.id === experimentId);
  
  if (experimentIndex === -1) {
    return res.status(404).json({ error: 'Experiment not found' });
  }

  const validStatuses = ['draft', 'running', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
    });
  }

  const experiment = experiments[experimentIndex];
  const now = new Date();
  
  // Handle status transitions
  const updatedExperiment = { ...experiment, status, updatedAt: now };
  
  if (status === 'running' && experiment.status === 'draft') {
    updatedExperiment.startDate = now;
  } else if (status === 'completed' && experiment.status === 'running') {
    updatedExperiment.endDate = now;
  }

  experiments[experimentIndex] = updatedExperiment;

  res.json({
    success: true,
    message: `Experiment status updated to ${status}`,
    experiment: experiments[experimentIndex]
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    experimentsCount: experiments.length
  });
});

app.listen(PORT, () => {
  console.log(`🚀 A/B Testing API Server running on port ${PORT}`);
  console.log(`📊 Managing ${experiments.length} experiments`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});

export default app;