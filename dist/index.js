"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// In-memory storage (in production, use a database)
let experiments = [];
let assignments = [];
let events = [];
// Initialize with sample data
const sampleExperiments = [
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
function generateId() {
    return 'exp_' + Math.random().toString(36).substr(2, 9);
}
function assignVariant(experiment, userId) {
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
function calculateResults(experimentId) {
    const experimentAssignments = assignments.filter(a => a.experimentId === experimentId);
    const experimentEvents = events.filter(e => e.experimentId === experimentId);
    const variantStats = {};
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
        }
        else {
            variant.lift = controlRate > 0
                ? ((variant.conversionRate / 100 - controlRate) / controlRate) * 100
                : 0;
        }
    });
    // Determine winner (simplified)
    const bestVariant = variants.reduce((best, current) => current.conversionRate > best.conversionRate ? current : best);
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
function enrichExperimentWithStats(experiment) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve experiments'
        });
    }
});
// Create a new experiment
app.post('/api/experiments', (req, res) => {
    try {
        const { name, description, variants, targetingRules, startDate, endDate } = req.body;
        if (!name || !variants || !Array.isArray(variants) || variants.length < 2) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Name and at least 2 variants are required'
            });
        }
        // Validate variant weights
        const totalWeight = variants.reduce((sum, variant) => sum + (variant.weight || 0), 0);
        if (totalWeight !== 100) {
            return res.status(400).json({
                error: 'Invalid variant weights',
                message: 'Variant weights must sum to 100'
            });
        }
        const newExperiment = {
            id: generateId(),
            name,
            description: description || '',
            status: 'draft',
            variants: variants.map((variant) => ({
                name: variant.name,
                weight: variant.weight,
                config: variant.config || {}
            })),
            targetingRules: targetingRules || [{ type: 'percentage', value: 100 }],
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        experiments.push(newExperiment);
        res.status(201).json(newExperiment);
    }
    catch (error) {
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
    }
    catch (error) {
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
        const { name, description, status, variants, targetingRules, startDate, endDate } = req.body;
        // Validate variant weights if variants are provided
        if (variants && Array.isArray(variants)) {
            const totalWeight = variants.reduce((sum, variant) => sum + (variant.weight || 0), 0);
            if (totalWeight !== 100) {
                return res.status(400).json({
                    error: 'Invalid variant weights',
                    message: 'Variant weights must sum to 100'
                });
            }
        }
        const updatedExperiment = {
            ...experiment,
            name: name || experiment.name,
            description: description !== undefined ? description : experiment.description,
            status: status || experiment.status,
            variants: variants ? variants.map((variant) => ({
                name: variant.name,
                weight: variant.weight,
                config: variant.config || {}
            })) : experiment.variants,
            targetingRules: targetingRules || experiment.targetingRules,
            startDate: startDate ? new Date(startDate) : experiment.startDate,
            endDate: endDate ? new Date(endDate) : experiment.endDate,
            updatedAt: new Date()
        };
        experiments[experimentIndex] = updatedExperiment;
        res.json(updatedExperiment);
    }
    catch (error) {
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
    }
    catch (error) {
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
        res.json(assignment);
    }
    catch (error) {
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
        const event = {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
        const updatedExperiment = {
            ...experiment,
            startDate: startDate ? new Date(startDate) : experiment.startDate,
            endDate: endDate ? new Date(endDate) : experiment.endDate,
            updatedAt: new Date()
        };
        experiments[experimentIndex] = updatedExperiment;
        res.json(updatedExperiment);
    }
    catch (error) {
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
exports.default = app;
