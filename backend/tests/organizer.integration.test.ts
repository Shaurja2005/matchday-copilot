/**
 * Integration tests — Organizer API (mocked GenAI responses)
 * Tests the situation summary, query, and sustainability endpoints.
 */

import request from 'supertest';
import app from '../src/index';

// Mock GenAI to avoid real API calls in tests
jest.mock('../src/services/genai/geminiService', () => ({
  callGenAI: jest.fn().mockImplementation(async ({ messages }) => {
    const prompt = messages[0].content as string;
    
    if (prompt.includes('sustainability')) {
      return {
        content: JSON.stringify({
          carbonFootprintSummary: 'Total estimated footprint: 1,200 tons CO2',
          recommendations: ['Promote shuttle buses over rideshare.'],
        }),
        cached: false,
        model: 'mock',
      };
    }

    if (prompt.includes('Which gates')) {
      return {
        content: 'I recommend opening Gate C based on your query.',
        cached: false,
        model: 'mock',
      };
    }

    // Default to summary response
    return {
      content: 'Here is your AI-generated stadium summary.',
      cached: false,
      model: 'mock',
    };
  }),
}));

// Set test environment
process.env.NODE_ENV = 'test';
process.env.GENAI_MODE = 'mock';

describe('Organizer API Routes', () => {
  describe('GET /api/organizer/summary', () => {
    it('should return 200 with an AI-generated situation summary', async () => {
      const response = await request(app).get('/api/organizer/summary');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toContain('Here is your AI-generated stadium summary.');
      expect(response.body).toHaveProperty('overallStatus');
      expect(response.body).toHaveProperty('keyMetrics');
    });
  });

  describe('POST /api/organizer/query', () => {
    it('should return 200 and answer natural language queries', async () => {
      const response = await request(app)
        .post('/api/organizer/query')
        .send({ query: 'Which gates need extra staff?' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('answer');
      expect(response.body.answer).toContain('I recommend opening Gate C based on your query.');
    });

    it('should return 400 for empty query', async () => {
      const response = await request(app)
        .post('/api/organizer/query')
        .send({ query: '' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  describe('GET /api/organizer/sustainability', () => {
    it('should return 200 with AI sustainability footprint analysis', async () => {
      const response = await request(app).get('/api/organizer/sustainability');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('aiAnalysis');
    });
  });
});
