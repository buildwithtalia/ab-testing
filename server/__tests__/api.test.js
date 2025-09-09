const request = require('supertest');
const app = require('../index');

describe('A/B Testing API', () => {
  it('should return OK for health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('should list all experiments', async () => {
    const res = await request(app).get('/api/experiments');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should create a new experiment', async () => {
    const experiment = {
      name: 'Test Experiment',
      description: 'API test',
      variants: [
        { name: 'A', weight: 50, config: {} },
        { name: 'B', weight: 50, config: {} }
      ],
      targetingRules: [{ type: 'percentage', value: 100 }]
    };
    const res = await request(app).post('/api/experiments').send(experiment);
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Test Experiment');
  });

  it('should assign a user to a variant', async () => {
    // Create experiment first
    const experiment = {
      name: 'Assign Test',
      description: 'Assign user',
      variants: [
        { name: 'A', weight: 50, config: {} },
        { name: 'B', weight: 50, config: {} }
      ],
      targetingRules: [{ type: 'percentage', value: 100 }]
    };
    const expRes = await request(app).post('/api/experiments').send(experiment);
    const expId = expRes.body.id;
    const assignRes = await request(app)
      .post(`/api/experiments/${expId}/assign`)
      .send({ userId: 'user123' });
    expect(assignRes.statusCode).toBe(200);
    expect(assignRes.body.userId).toBe('user123');
    expect(assignRes.body.variant).toBeDefined();
  });

  it('should track a conversion event', async () => {
    // Create experiment and assign user
    const experiment = {
      name: 'Track Test',
      description: 'Track event',
      variants: [
        { name: 'A', weight: 50, config: {} },
        { name: 'B', weight: 50, config: {} }
      ],
      targetingRules: [{ type: 'percentage', value: 100 }]
    };
    const expRes = await request(app).post('/api/experiments').send(experiment);
    const expId = expRes.body.id;
    await request(app).post(`/api/experiments/${expId}/assign`).send({ userId: 'user456' });
    const trackRes = await request(app)
      .post(`/api/experiments/${expId}/track`)
      .send({ userId: 'user456', eventType: 'conversion', value: 1 });
    expect(trackRes.statusCode).toBe(200);
    expect(trackRes.body.success).toBe(true);
  });

  it('should get experiment results', async () => {
    // Create experiment
    const experiment = {
      name: 'Results Test',
      description: 'Get results',
      variants: [
        { name: 'A', weight: 50, config: {} },
        { name: 'B', weight: 50, config: {} }
      ],
      targetingRules: [{ type: 'percentage', value: 100 }]
    };
    const expRes = await request(app).post('/api/experiments').send(experiment);
    const expId = expRes.body.id;
    const resultsRes = await request(app).get(`/api/experiments/${expId}/results`);
    expect(resultsRes.statusCode).toBe(200);
    expect(resultsRes.body.experimentId).toBe(expId);
    expect(Array.isArray(resultsRes.body.variants)).toBe(true);
  });
});
