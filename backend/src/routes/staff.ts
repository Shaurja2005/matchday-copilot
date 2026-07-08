/**
 * MatchDay Copilot — Staff API Routes
 * GET /api/staff/briefing — AI-generated shift briefing
 * POST /api/staff/incident — Create + triage an incident
 * GET /api/staff/incidents — List open incidents
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { apiRateLimiter, chatRateLimiter } from '../middleware/rateLimiter';
import { getCrowdSnapshot } from '../services/crowd/crowdSimulator';
import { callGenAI } from '../services/genai/geminiService';
import { buildShiftBriefingPrompt } from '../prompts/staffBriefing';
import { buildIncidentTriagePrompt } from '../prompts/incidentTriage';
import { Incident, ShiftBriefing } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const router = Router();

// In-memory incident store (would be a DB in production)
const incidents: Incident[] = [];

// GET /api/staff/briefing — Generate AI shift briefing
router.get('/briefing', chatRateLimiter, async (_req: Request, res: Response): Promise<void> => {
  try {
    const snapshot = getCrowdSnapshot();
    const prompt = buildShiftBriefingPrompt(snapshot);

    const response = await callGenAI({
      systemPrompt: 'You are a professional stadium operations assistant.',
      messages: [{ role: 'user', content: prompt }],
      persona: 'staff',
      useCache: false,
      maxTokens: 800,
    });

    const hotspots = snapshot.zones
      .filter((z) => z.status !== 'normal')
      .map((z) => ({
        zoneId: z.id,
        zoneName: z.name,
        densityPercent: z.densityPercent,
        reason: `${z.densityPercent}% capacity (${z.status})`,
      }));

    const briefing: ShiftBriefing = {
      generatedAt: new Date().toISOString(),
      summary: response.content,
      hotspots,
      recommendedActions: [],
      staffingNotes: 'Generated from simulated live data. Human review required.',
    };

    res.json(briefing);
  } catch (error) {
    logger.error('Briefing endpoint error', error);
    res.status(500).json({ error: 'Failed to generate shift briefing.' });
  }
});

// POST /api/staff/incident — Create and triage a new incident
router.post(
  '/incident',
  chatRateLimiter,
  [
    body('description').isString().trim().notEmpty().isLength({ max: 1000 }),
    body('reportedBy').isString().trim().notEmpty().isLength({ max: 100 }),
    body('gateId').optional().isString(),
    body('zoneId').optional().isString(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const { description, reportedBy, gateId, zoneId } = req.body as {
      description: string;
      reportedBy: string;
      gateId?: string;
      zoneId?: string;
    };

    try {
      const triagePrompt = buildIncidentTriagePrompt(description, gateId, zoneId);

      const response = await callGenAI({
        systemPrompt: 'You are a professional incident triage system.',
        messages: [{ role: 'user', content: triagePrompt }],
        persona: 'staff',
        maxTokens: 400,
      });

      // Parse AI triage response
      let triage = {
        severity: 'medium' as Incident['severity'],
        triageSummary: 'AI triage unavailable — human assessment required.',
        recommendedNextStep: 'Consider assessing the incident in person.',
      };

      try {
        const parsed = JSON.parse(response.content) as {
          severity: string;
          triageSummary: string;
          recommendedNextStep: string;
        };
        triage = {
          severity: (['low', 'medium', 'high', 'critical'].includes(parsed.severity?.toLowerCase())
            ? parsed.severity.toLowerCase()
            : 'medium') as Incident['severity'],
          triageSummary: parsed.triageSummary || triage.triageSummary,
          recommendedNextStep: parsed.recommendedNextStep || triage.recommendedNextStep,
        };
      } catch {
        logger.warn('Failed to parse incident triage JSON — using defaults');
      }

      const incident: Incident = {
        id: uuidv4(),
        reportedAt: new Date().toISOString(),
        gateId,
        zoneId,
        description,
        reportedBy,
        severity: triage.severity,
        aiTriageSuggestion: triage.triageSummary,
        aiRecommendedNextStep: triage.recommendedNextStep,
        status: 'open',
      };

      incidents.push(incident);
      res.status(201).json(incident);
    } catch (error) {
      logger.error('Incident creation error', error);
      res.status(500).json({ error: 'Failed to create incident.' });
    }
  }
);

// GET /api/staff/incidents — List all incidents
router.get('/incidents', apiRateLimiter, (_req: Request, res: Response) => {
  res.json({ incidents: incidents.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt)) });
});

// PATCH /api/staff/incidents/:id — Update incident status
router.patch(
  '/incidents/:id',
  apiRateLimiter,
  [body('status').isIn(['open', 'in_progress', 'resolved'])],
  (req: Request, res: Response): void => {
    const { id } = req.params;
    const { status } = req.body as { status: Incident['status'] };
    const incident = incidents.find((i) => i.id === id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    incident.status = status;
    res.json(incident);
  }
);

export default router;
