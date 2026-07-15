/**
 * MatchDay Copilot — Organizer API Routes
 *
 * Endpoints:
 *   GET  /api/organizer/summary        — AI-generated control-room situation summary
 *   POST /api/organizer/query          — Natural-language query over live data
 *   GET  /api/organizer/sustainability — Transport carbon footprint analysis
 *
 * Design note: All system prompts are imported from the prompt template module
 * (not defined inline) so that prompt text is auditable in one place.
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
  ORGANIZER_SUMMARY_SYSTEM_PROMPT,
  ORGANIZER_QUERY_SYSTEM_PROMPT,
  ORGANIZER_SUSTAINABILITY_SYSTEM_PROMPT,
} from '../prompts/organizerSummary';
import {
  computeOverallDensityPercent,
  densityToStatus,
  densityToMetricStatus,
  queueTimeToMetricStatus,
} from '../utils/crowdFormatter';
import transportData from '../data/transport.json';
import { TransportRoute } from '../types';
import { logger } from '../utils/logger';

const router = Router();

const transport = transportData as TransportRoute[];

// -----------------------------------------------
// GET /api/organizer/summary
// -----------------------------------------------

/**
 * Generate an AI-powered control-room situation summary for senior organizers.
 * Uses the current crowd snapshot + transport data to produce a structured
 * overview including key metrics, top concerns, and recommended actions.
 *
 * GenAI role: narrative synthesis only — all decisions remain with human operators.
 */
router.get('/summary', chatRateLimiter, async (_req: Request, res: Response): Promise<void> => {
  try {
    const snapshot = getCrowdSnapshot();
    const prompt = buildOrganizerSummaryPrompt(snapshot, transport);

    const response = await callGenAI({
      systemPrompt: ORGANIZER_SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      persona: 'organizer',
      maxTokens: 1000,
    });

    const totalDensity = computeOverallDensityPercent(snapshot);

    res.json({
      generatedAt: new Date().toISOString(),
      overallStatus: densityToStatus(totalDensity),
      summary: response.content,
      keyMetrics: [
        {
          label: 'Total Occupancy',
          value: `${snapshot.totalOccupancy.toLocaleString()} / ${snapshot.totalCapacity.toLocaleString()}`,
          status: densityToMetricStatus(totalDensity),
        },
        ...snapshot.queues.slice(0, 4).map((q) => ({
          label: `${q.gateName} Queue`,
          value: q.waitTimeMinutes,
          unit: 'min',
          trend: q.trend === 'increasing' ? 'up' : q.trend === 'decreasing' ? 'down' : 'stable',
          status: queueTimeToMetricStatus(q.waitTimeMinutes),
        })),
      ],
    });
  } catch (error) {
    logger.error('Organizer summary error', error);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

// -----------------------------------------------
// POST /api/organizer/query
// -----------------------------------------------

/**
 * Answer a natural-language query from an organizer by reasoning over live data.
 * Allows questions like "Which gates need extra staff in 30 min?" without
 * the organizer needing to interpret raw numbers themselves.
 */
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
        systemPrompt: ORGANIZER_QUERY_SYSTEM_PROMPT,
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

// -----------------------------------------------
// GET /api/organizer/sustainability
// -----------------------------------------------

/**
 * Generate a sustainability analysis for the current event.
 * Estimates the transport carbon footprint from simulated ridership data and
 * provides AI-generated suggestions to shift fans toward greener options.
 *
 * Carbon estimates are approximate and based on mock transport data.
 * In production, connect to real ticketing/transport APIs for accurate figures.
 */
router.get(
  '/sustainability',
  apiRateLimiter,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const snapshot = getCrowdSnapshot();
      const prompt = buildSustainabilityPrompt(transport, snapshot.totalOccupancy);

      const response = await callGenAI({
        systemPrompt: ORGANIZER_SUSTAINABILITY_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
        persona: 'organizer',
        useCache: true,
        maxTokens: 600,
      });

      // Compute per-mode carbon estimates from simulated ridership share.
      // Crowding level is used as a proxy for mode share:
      //   high → 30% of attendees, medium → 20%, low → 10%.
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
