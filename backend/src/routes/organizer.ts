/**
 * MatchDay Copilot — Organizer API Routes
 * GET /api/organizer/summary — AI-generated situation summary
 * POST /api/organizer/query — Natural language query over mock data
 * GET /api/organizer/sustainability — Carbon footprint analysis
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { chatRateLimiter, apiRateLimiter } from '../middleware/rateLimiter';
import { getCrowdSnapshot } from '../services/crowd/crowdSimulator';
import { callGenAI } from '../services/genai/geminiService';
import {
  buildOrganizerSummaryPrompt,
  buildOrganizerQueryPrompt,
  buildSustainabilityPrompt,
} from '../prompts/organizerSummary';
import transportData from '../data/transport.json';
import { TransportRoute } from '../types';
import { logger } from '../utils/logger';

const router = Router();

const transport = transportData as TransportRoute[];

// GET /api/organizer/summary — AI-generated situation summary
router.get('/summary', chatRateLimiter, async (_req: Request, res: Response): Promise<void> => {
  try {
    const snapshot = getCrowdSnapshot();
    const prompt = buildOrganizerSummaryPrompt(snapshot, transport);

    const response = await callGenAI({
      systemPrompt: 'You are MatchDay Copilot, a professional stadium operations intelligence system.',
      messages: [{ role: 'user', content: prompt }],
      persona: 'organizer',
      maxTokens: 1000,
    });

    const totalDensity = Math.round(
      (snapshot.totalOccupancy / snapshot.totalCapacity) * 100
    );

    res.json({
      generatedAt: new Date().toISOString(),
      overallStatus: totalDensity >= 90 ? 'red' : totalDensity >= 75 ? 'amber' : 'green',
      summary: response.content,
      keyMetrics: [
        {
          label: 'Total Occupancy',
          value: `${snapshot.totalOccupancy.toLocaleString()} / ${snapshot.totalCapacity.toLocaleString()}`,
          status: totalDensity >= 90 ? 'critical' : totalDensity >= 75 ? 'warning' : 'ok',
        },
        ...snapshot.queues.slice(0, 4).map((q) => ({
          label: `${q.gateName} Queue`,
          value: q.waitTimeMinutes,
          unit: 'min',
          trend: q.trend === 'increasing' ? 'up' : q.trend === 'decreasing' ? 'down' : 'stable',
          status: q.waitTimeMinutes >= 20 ? 'critical' : q.waitTimeMinutes >= 12 ? 'warning' : 'ok',
        })),
      ],
    });
  } catch (error) {
    logger.error('Organizer summary error', error);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

// POST /api/organizer/query — Natural language query
router.post(
  '/query',
  chatRateLimiter,
  [
    body('query')
      .isString()
      .trim()
      .notEmpty()
      .isLength({ max: 500 })
      .withMessage('Query must be a non-empty string under 500 characters'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { query } = req.body as { query: string };

    try {
      const snapshot = getCrowdSnapshot();
      const prompt = buildOrganizerQueryPrompt(query, snapshot, transport);

      const response = await callGenAI({
        systemPrompt:
          'You are MatchDay Copilot, an AI operations assistant. Answer questions by reasoning over the provided live data.',
        messages: [{ role: 'user', content: prompt }],
        persona: 'organizer',
        maxTokens: 400,
      });

      res.json({
        query,
        answer: response.content,
        dataTimestamp: snapshot.timestamp,
        cached: response.cached,
      });
    } catch (error) {
      logger.error('Organizer query error', error);
      res.status(500).json({ error: 'Failed to process query.' });
    }
  }
);

// GET /api/organizer/sustainability — Carbon footprint analysis
router.get(
  '/sustainability',
  apiRateLimiter,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const snapshot = getCrowdSnapshot();
      const prompt = buildSustainabilityPrompt(transport, snapshot.totalOccupancy);

      const response = await callGenAI({
        systemPrompt: 'You are MatchDay Copilot, a sustainability analysis assistant for large events.',
        messages: [{ role: 'user', content: prompt }],
        persona: 'organizer',
        useCache: true,
        maxTokens: 600,
      });

      // Compute per-mode carbon estimates
      const byMode: Record<string, number> = {};
      for (const route of transport) {
        const modeShare = route.crowdingLevel === 'high' ? 0.3 : route.crowdingLevel === 'medium' ? 0.2 : 0.1;
        const modeRiders = Math.round(snapshot.totalOccupancy * modeShare);
        byMode[route.type] = (byMode[route.type] || 0) + modeRiders * route.carbonKgPerPerson;
      }

      res.json({
        generatedAt: new Date().toISOString(),
        estimatedAttendance: snapshot.totalOccupancy,
        byTransportMode: byMode,
        aiAnalysis: response.content,
        note: 'Carbon estimates are approximate and based on simulated transport usage data.',
      });
    } catch (error) {
      logger.error('Sustainability endpoint error', error);
      res.status(500).json({ error: 'Failed to generate sustainability report.' });
    }
  }
);

export default router;
