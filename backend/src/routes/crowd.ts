/**
 * MatchDay Copilot — Crowd Data API Routes
 * GET /api/crowd/zones — Live zone density
 * GET /api/crowd/queues — Current queue times
 * GET /api/crowd/decisions — AI decision recommendations
 */

import { Router, Request, Response } from 'express';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { getCrowdSnapshot } from '../services/crowd/crowdSimulator';
import { evaluateCrowdDecisions } from '../services/crowd/decisionEngine';
import gatesData from '../data/gates.json';
import transportData from '../data/transport.json';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/crowd/zones
router.get('/zones', apiRateLimiter, (_req: Request, res: Response) => {
  const snapshot = getCrowdSnapshot();
  res.json({
    timestamp: snapshot.timestamp,
    zones: snapshot.zones,
    totalOccupancy: snapshot.totalOccupancy,
    totalCapacity: snapshot.totalCapacity,
    note: 'SIMULATED DATA — for demonstration purposes only',
  });
});

// GET /api/crowd/queues
router.get('/queues', apiRateLimiter, (_req: Request, res: Response) => {
  const snapshot = getCrowdSnapshot();
  res.json({
    timestamp: snapshot.timestamp,
    queues: snapshot.queues,
    note: 'SIMULATED DATA — for demonstration purposes only',
  });
});

// GET /api/crowd/gates
router.get('/gates', apiRateLimiter, (_req: Request, res: Response) => {
  res.json({ gates: gatesData });
});

// GET /api/crowd/transport
router.get('/transport', apiRateLimiter, (_req: Request, res: Response) => {
  res.json({ transport: transportData });
});

// GET /api/crowd/decisions — Evaluate current state and return AI recommendations
router.get('/decisions', apiRateLimiter, async (_req: Request, res: Response): Promise<void> => {
  try {
    const snapshot = getCrowdSnapshot();
    const decisions = await evaluateCrowdDecisions(snapshot);
    res.json({
      timestamp: new Date().toISOString(),
      decisions,
      count: decisions.length,
      note: 'HUMAN APPROVAL REQUIRED — These are AI suggestions, not autonomous actions.',
    });
  } catch (error) {
    logger.error('Decisions endpoint error', error);
    res.status(500).json({ error: 'Failed to evaluate decisions.' });
  }
});

// GET /api/crowd/snapshot — Full snapshot
router.get('/snapshot', apiRateLimiter, (_req: Request, res: Response) => {
  const snapshot = getCrowdSnapshot();
  res.json(snapshot);
});

export default router;
