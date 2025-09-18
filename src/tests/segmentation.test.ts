import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../server/index';

// Mock data for testing
const testExperiment = {
  name: 'Segmentation Test Experiment',
  description: 'Testing user segmentation rules',
  variants: [
    { name: 'control', weight: 50, config: { buttonColor: '#blue' } },
    { name: 'treatment', weight: 50, config: { buttonColor: '#red' } }
  ],
  segmentationRules: [
    { field: 'country', operator: 'equals', value: 'US' },
    { field: 'device', operator: 'in', value: ['mobile', 'tablet'] }
  ]
};

const testUser = {
  userId: 'test-user-123',
  attributes: {
    country: 'US',
    device: 'mobile',
    age: 25
  }
};

const nonMatchingUser = {
  userId: 'test-user-456',
  attributes: {
    country: 'UK',
    device: 'desktop'
  }
};

let server: any;
let experimentId: string;

beforeAll(async () => {
  server = app.listen(0); // Use random port for testing
});

afterAll(async () => {
  if (server) {
    server.close();
  }
});

describe('Segmentation Rules API', () => {
  beforeEach(async () => {
    // Create a test experiment before each test
    const response = await request(app)
      .post('/api/experiments')
      .send(testExperiment)
      .expect(201);
    
    experimentId = response.body.id;
  });

  describe('Experiment Creation with Segmentation Rules', () => {
    test('should create experiment with valid segmentation rules', async () => {
      const response = await request(app)
        .post('/api/experiments')
        .send(testExperiment)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.segmentationRules).toEqual(testExperiment.segmentationRules);
    });

    test('should reject experiment with invalid segmentation rules', async () => {
      const invalidExperiment = {
        ...testExperiment,
        segmentationRules: [
          { field: '', operator: 'equals', value: 'US' } // Invalid: empty field
        ]
      };

      const response = await request(app)
        .post('/api/experiments')
        .send(invalidExperiment)
        .expect(400);

      expect(response.body.error).toBe('Invalid segmentation rules');
    });

    test('should reject experiment with invalid operator', async () => {
      const invalidExperiment = {
        ...testExperiment,
        segmentationRules: [
          { field: 'country', operator: 'invalid_op', value: 'US' }
        ]
      };

      const response = await request(app)
        .post('/api/experiments')
        .send(invalidExperiment)
        .expect(400);

      expect(response.body.error).toBe('Invalid segmentation rules');
    });

    test('should create experiment without segmentation rules', async () => {
      const experimentWithoutRules = {
        name: 'No Rules Experiment',
        description: 'No segmentation rules',
        variants: [
          { name: 'control', weight: 50 },
          { name: 'treatment', weight: 50 }
        ]
      };

      const response = await request(app)
        .post('/api/experiments')
        .send(experimentWithoutRules)
        .expect(201);

      expect(response.body.segmentationRules).toEqual([]);
    });
  });

  describe('User Assignment with Segmentation Rules', () => {
    test('should assign matching user to variant', async () => {
      const response = await request(app)
        .post(`/api/experiments/${experimentId}/assign`)
        .send(testUser)
        .expect(200);

      expect(response.body).toHaveProperty('experimentId', experimentId);
      expect(response.body).toHaveProperty('userId', testUser.userId);
      expect(response.body).toHaveProperty('variant');
      expect(response.body.eligible).toBe(true);
    });

    test('should reject non-matching user', async () => {
      const response = await request(app)
        .post(`/api/experiments/${experimentId}/assign`)
        .send(nonMatchingUser)
        .expect(200);

      expect(response.body.eligible).toBe(false);
      expect(response.body.message).toContain('does not match segmentation criteria');
    });

    test('should require attributes for experiments with segmentation rules', async () => {
      const userWithoutAttributes = { userId: 'test-user-789' };
      
      const response = await request(app)
        .post(`/api/experiments/${experimentId}/assign`)
        .send(userWithoutAttributes)
        .expect(400);

      expect(response.body.error).toBe('Missing user attributes');
    });

    test('should handle missing user attributes gracefully', async () => {
      const userWithPartialAttributes = {
        userId: 'test-user-partial',
        attributes: {
          country: 'US'
          // Missing 'device' attribute
        }
      };

      const response = await request(app)
        .post(`/api/experiments/${experimentId}/assign`)
        .send(userWithPartialAttributes)
        .expect(200);

      expect(response.body.eligible).toBe(false);
    });
  });

  describe('Segmentation Rule Operators', () => {
    test('should handle "equals" operator correctly', async () => {
      const exactMatchUser = {
        userId: 'exact-match-user',
        attributes: { country: 'US', device: 'mobile' }
      };

      const response = await request(app)
        .post(`/api/experiments/${experimentId}/assign`)
        .send(exactMatchUser)
        .expect(200);

      expect(response.body.eligible).toBe(true);
    });

    test('should handle "in" operator correctly', async () => {
      const inArrayUser = {
        userId: 'in-array-user',
        attributes: { country: 'US', device: 'tablet' } // tablet is in ['mobile', 'tablet']
      };

      const response = await request(app)
        .post(`/api/experiments/${experimentId}/assign`)
        .send(inArrayUser)
        .expect(200);

      expect(response.body.eligible).toBe(true);
    });

    test('should handle numeric comparisons', async () => {
      // Create experiment with numeric rules
      const numericExperiment = {
        name: 'Numeric Test',
        description: 'Testing numeric operators',
        variants: [
          { name: 'control', weight: 50 },
          { name: 'treatment', weight: 50 }
        ],
        segmentationRules: [
          { field: 'age', operator: 'greater_than', value: 18 }
        ]
      };

      const createResponse = await request(app)
        .post('/api/experiments')
        .send(numericExperiment)
        .expect(201);

      const numericExpId = createResponse.body.id;

      const adultUser = {
        userId: 'adult-user',
        attributes: { age: 25 }
      };

      const assignResponse = await request(app)
        .post(`/api/experiments/${numericExpId}/assign`)
        .send(adultUser)
        .expect(200);

      expect(assignResponse.body.eligible).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle experiment without segmentation rules', async () => {
      // Create experiment without segmentation rules
      const noRulesExperiment = {
        name: 'No Rules Test',
        description: 'No segmentation',
        variants: [
          { name: 'control', weight: 50 },
          { name: 'treatment', weight: 50 }
        ]
      };

      const createResponse = await request(app)
        .post('/api/experiments')
        .send(noRulesExperiment)
        .expect(201);

      const noRulesExpId = createResponse.body.id;

      // Should assign any user regardless of attributes
      const anyUser = { userId: 'any-user' };

      const assignResponse = await request(app)
        .post(`/api/experiments/${noRulesExpId}/assign`)
        .send(anyUser)
        .expect(200);

      expect(assignResponse.body.eligible).toBe(true);
    });

    test('should maintain consistent assignment for same user', async () => {
      // Assign same user multiple times
      const user = {
        userId: 'consistent-user',
        attributes: { country: 'US', device: 'mobile' }
      };

      const response1 = await request(app)
        .post(`/api/experiments/${experimentId}/assign`)
        .send(user)
        .expect(200);

      const response2 = await request(app)
        .post(`/api/experiments/${experimentId}/assign`)
        .send(user)
        .expect(200);

      expect(response1.body.variant).toEqual(response2.body.variant);
      expect(response1.body.assignedAt).toBe(response2.body.assignedAt);
    });
  });
});