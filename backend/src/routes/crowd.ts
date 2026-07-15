/**
 * MatchDay Copilot — Crowd Data API Routes
 *
 * Endpoints:
 *   GET /api/crowd/zones      — Live zone density readings
 *   GET /api/crowd/queues     — Current gate queue wait times
 *   GET /api/crowd/gates      — Static gate metadata (location, capacity, accessibility)
 *   GET /api/crowd/transport  — Transport routes and ETA data
 *   GET /api/crowd/decisions  — AI decision recommendations for current state
 *   GET /api/crowd/snapshot   — Full combined crowd snapshot
 *
 * All data returned by this router is labeled as SIMULATED DATA in the response
 * body so that consumers always know this is demo data, not real sensor feeds.
 */

import { Router, Request, Response } from 'express';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { getCrowdSnapshot } from '../services/crowd/crowdSimulator';
import { evaluateCrowdDecisions } from '../services/crowd/decisionEngine';
import gatesData from '../data/gates.json';
import transportData from '../data/transport.json';
import { logger } from '../utils/logger';

const router = Router();

// -----------------------------------------------
// GET /api/crowd/zones
// -----------------------------------------------

/**
 * Return the current occupancy and density status for all stadium zones.
 * Polled by the frontend every 30 seconds to update the crowd heatmap.
 */
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

// -----------------------------------------------
// GET /api/crowd/queues
// -----------------------------------------------

/**
 * Return current gate queue wait times and trend directions.
 * Used by the fan chat widget to inject live queue data into prompts.
 */
router.get('/queues', apiRateLimiter, (_req: Request, res: Response) => {
  const snapshot = getCrowdSnapshot();
  res.json({
    timestamp: snapshot.timestamp,
    queues: snapshot.queues,
    note: 'SIMULATED DATA — for demonstration purposes only',
  });
});

// -----------------------------------------------
// GET /api/crowd/gates
// -----------------------------------------------

/**
 * Return static gate metadata: coordinates, capacity, accessibility features,
 * and nearby facilities. This data does not change during a simulation tick.
 */
router.get('/gates', apiRateLimiter, (_req: Request, res: Response) => {
  res.json({ gates: gatesData });
});

// -----------------------------------------------
// GET /api/crowd/transport
// -----------------------------------------------

/**
 * Return transport route data including ETA, crowding level, and carbon
 * footprint per person. Used by the sustainability panel and fan assistant.
 */
router.get('/transport', apiRateLimiter, (_req: Request, res: Response) => {
  res.json({ transport: transportData });
});

// -----------------------------------------------
// GET /api/crowd/decisions
// -----------------------------------------------

/**
 * Evaluate the current crowd state against decision-engine thresholds and
 * return any triggered AI recommendations for organizer review.
 *
 * IMPORTANT: All decisions have isHumanApprovalRequired = true.
 * This endpoint never triggers autonomous actions — it surfaces suggestions only.
 */
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

// -----------------------------------------------
// GET /api/crowd/snapshot
// -----------------------------------------------

/**
 * Return the full combined crowd snapshot (zones + queues + totals).
 * Useful for clients that need all crowd data in a single call.
 */
router.get('/snapshot', apiRateLimiter, (_req: Request, res: Response) => {
  const snapshot = getCrowdSnapshot();
  res.json(snapshot);
});

export default router;
