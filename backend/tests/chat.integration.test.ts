/**
 * Integration tests — Chat API (mocked GenAI responses)
 * Tests the full request pipeline without a live API key.
 */

import request from 'supertest';
import app from '../src/index';

// Mock GenAI to avoid real API calls in tests
jest.mock('../src/services/genai/geminiService', () => ({
  callGenAI: jest.fn().mockResolvedValue({
    content: 'The nearest accessible restroom to Gate D is located 30 meters north. Follow the blue signs.',
    cached: false,
    model: 'mock',
  }),
  detectLanguage: jest.fn().mockResolvedValue('en'),
}));

// Set test environment
process.env.NODE_ENV = 'test';
process.env.GENAI_MODE = 'mock';

describe('POST /api/chat', () => {
  it('should return 200 with a reply for a valid fan message', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'Where is the nearest restroom to Gate D?',
        persona: 'fan',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reply');
    expect(typeof response.body.reply).toBe('string');
    expect(response.body.reply.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('detectedLanguage');
    expect(response.body).toHaveProperty('safetyFlagged');
    expect(response.body.safetyFlagged).toBe(false);
  });

  it('should return 400 for an empty message', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: '' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 for a message exceeding 1000 characters', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'a'.repeat(1001) });

    expect(response.status).toBe(400);
  });

  it('should return 400 for an invalid persona', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello', persona: 'hacker' });

    expect(response.status).toBe(400);
  });

  it('should accept valid user context', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({
        message: 'How do I get to my seat?',
        persona: 'fan',
        userContext: {
          hasWheelchair: true,
          ticketSection: '214',
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.reply).toBeTruthy();
  });

  it('should include cached indicator in response', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Where is the food court?' });

    expect(response.body).toHaveProperty('cached');
    expect(typeof response.body.cached).toBe('boolean');
  });
});

describe('POST /api/chat/staff-reply', () => {
  it('should return 200 with a translated reply for valid staff input', async () => {
    const response = await request(app)
      .post('/api/chat/staff-reply')
      .send({
        staffNote: 'Tell the fan that Gate C is clear and they can enter without waiting.',
        targetLanguage: 'es',
        fanOriginalMessage: '¿Puedo entrar por la Puerta A?',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reply');
  });

  it('should return 400 for unsupported language', async () => {
    const response = await request(app)
      .post('/api/chat/staff-reply')
      .send({
        staffNote: 'Direct to Gate C',
        targetLanguage: 'zh',
        fanOriginalMessage: 'Help',
      });

    expect(response.status).toBe(400);
  });
});

describe('GET /health', () => {
  it('should return 200 with status ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('GET /api/crowd/zones', () => {
  it('should return zone data with simulated note', async () => {
    const response = await request(app).get('/api/crowd/zones');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('zones');
    expect(Array.isArray(response.body.zones)).toBe(true);
    expect(response.body.note).toContain('SIMULATED');
  });
});

describe('GET /api/crowd/queues', () => {
  it('should return queue data', async () => {
    const response = await request(app).get('/api/crowd/queues');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('queues');
    expect(Array.isArray(response.body.queues)).toBe(true);
  });
});
