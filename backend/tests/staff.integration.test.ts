/**
 * Integration tests — Staff API (mocked GenAI responses)
 * Tests the shift briefing and incident triage endpoints.
 */

import request from 'supertest';
import app from '../src/index';

// Mock GenAI to avoid real API calls in tests
jest.mock('../src/services/genai/geminiService', () => ({
  callGenAI: jest.fn().mockImplementation(async ({ systemPrompt, messages }) => {
    const prompt = messages[0].content;
    if (prompt.includes('incident triage assistant')) {
      return {
        content: JSON.stringify({
          severity: 'high',
          triageSummary: 'Medical emergency reported.',
          recommendedNextStep: 'Dispatch medical team immediately.',
        }),
        cached: false,
        model: 'mock',
      };
    }
    return {
      content: 'Here is your AI-generated shift briefing: Monitor Gate A.',
      cached: false,
      model: 'mock',
    };
  }),
}));

// Set test environment
process.env.NODE_ENV = 'test';
process.env.GENAI_MODE = 'mock';

describe('Staff API Routes', () => {
  describe('GET /api/staff/briefing', () => {
    it('should return 200 with an AI-generated shift briefing', async () => {
      const response = await request(app).get('/api/staff/briefing');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toContain('Here is your AI-generated shift briefing');
      expect(response.body).toHaveProperty('hotspots');
    });
  });

  describe('POST /api/staff/incident', () => {
    it('should return 200 and triage a new incident', async () => {
      const response = await request(app)
        .post('/api/staff/incident')
        .send({
          description: 'Fan fainted near the north entrance.',
          reportedBy: 'Volunteer John',
          gateId: 'gate-a',
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('severity', 'high');
      expect(response.body).toHaveProperty('aiTriageSuggestion', 'Medical emergency reported.');
      expect(response.body).toHaveProperty('aiRecommendedNextStep', 'Dispatch medical team immediately.');
    });

    it('should return 400 for invalid incident data', async () => {
      const response = await request(app)
        .post('/api/staff/incident')
        .send({
          description: '', // invalid
          reportedBy: 'Volunteer John',
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /api/staff/incidents', () => {
    it('should return 200 and list incidents', async () => {
      const response = await request(app).get('/api/staff/incidents');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.incidents)).toBe(true);
    });
  });
});
