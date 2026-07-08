/**
 * Unit tests — Decision Engine (rules + GenAI hybrid logic)
 * Tests that deterministic thresholds fire correctly independently of GenAI.
 */

import {
  evaluateCrowdDecisions,
  QUEUE_ALERT_THRESHOLD_MINUTES,
  DENSITY_ALERT_THRESHOLD_PERCENT,
} from '../src/services/crowd/decisionEngine';
import { setSimulationState } from '../src/services/crowd/crowdSimulator';
import { CrowdSnapshot, Zone, Queue, Decision } from '../src/types';

// Mock the GenAI service so tests don't require a live API key
jest.mock('../src/services/genai/geminiService', () => ({
  callGenAI: jest.fn().mockResolvedValue({
    content: JSON.stringify({
      recommendation: 'Consider redirecting fans to Gate C.',
      rationale: 'Queue exceeds threshold.',
    }),
    cached: false,
    model: 'mock',
  }),
  detectLanguage: jest.fn().mockResolvedValue('en'),
}));

const makeZone = (overrides: Partial<Zone>): Zone => ({
  id: 'zone-test',
  name: 'Test Zone',
  label: 'Test Zone',
  gateIds: ['gate-a'],
  capacity: 10000,
  currentOccupancy: 5000,
  densityPercent: 50,
  status: 'normal',
  sections: ['100'],
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  ...overrides,
});

const makeQueue = (overrides: Partial<Queue>): Queue => ({
  id: 'queue-test',
  gateId: 'gate-test',
  gateName: 'Gate Test',
  waitTimeMinutes: 5,
  trend: 'stable',
  lastUpdated: new Date().toISOString(),
  ...overrides,
});

const makeSnapshot = (zones: Zone[], queues: Queue[]): CrowdSnapshot => ({
  timestamp: new Date().toISOString(),
  zones,
  queues,
  totalOccupancy: zones.reduce((s, z) => s + z.currentOccupancy, 0),
  totalCapacity: zones.reduce((s, z) => s + z.capacity, 0),
});

describe('Decision Engine — Deterministic Rules', () => {
  describe('Queue Threshold', () => {
    it(`should NOT trigger a decision when queue is below ${QUEUE_ALERT_THRESHOLD_MINUTES} minutes`, async () => {
      const snapshot = makeSnapshot(
        [makeZone({ densityPercent: 40 })],
        [makeQueue({ waitTimeMinutes: QUEUE_ALERT_THRESHOLD_MINUTES - 1 })]
      );
      const decisions = await evaluateCrowdDecisions(snapshot);
      const queueDecisions = decisions.filter((d: Decision) => d.type === 'queue_alert');
      expect(queueDecisions).toHaveLength(0);
    });

    it(`should trigger a decision when queue equals ${QUEUE_ALERT_THRESHOLD_MINUTES} minutes`, async () => {
      const snapshot = makeSnapshot(
        [makeZone({ densityPercent: 40 })],
        [makeQueue({ waitTimeMinutes: QUEUE_ALERT_THRESHOLD_MINUTES })]
      );
      const decisions = await evaluateCrowdDecisions(snapshot);
      const queueDecisions = decisions.filter((d: Decision) => d.type === 'queue_alert');
      expect(queueDecisions).toHaveLength(1);
    });

    it('should trigger a HIGH severity decision when queue is 1.5x threshold', async () => {
      const snapshot = makeSnapshot(
        [makeZone({ densityPercent: 40 })],
        [makeQueue({ waitTimeMinutes: Math.ceil(QUEUE_ALERT_THRESHOLD_MINUTES * 1.5) })]
      );
      const decisions = await evaluateCrowdDecisions(snapshot);
      const queueDecision = decisions.find((d: Decision) => d.type === 'queue_alert');
      expect(queueDecision?.severity).toBe('high');
    });

    it('should trigger MEDIUM severity when queue is exactly at threshold', async () => {
      const snapshot = makeSnapshot(
        [makeZone({ densityPercent: 40 })],
        [makeQueue({ waitTimeMinutes: QUEUE_ALERT_THRESHOLD_MINUTES })]
      );
      const decisions = await evaluateCrowdDecisions(snapshot);
      expect(decisions[0].severity).toBe('medium');
    });

    it('should trigger multiple decisions for multiple critical queues', async () => {
      const snapshot = makeSnapshot(
        [makeZone({ densityPercent: 40 })],
        [
          makeQueue({ id: 'q1', gateId: 'g1', waitTimeMinutes: 25 }),
          makeQueue({ id: 'q2', gateId: 'g2', waitTimeMinutes: 30 }),
        ]
      );
      const decisions = await evaluateCrowdDecisions(snapshot);
      const queueDecisions = decisions.filter((d: Decision) => d.type === 'queue_alert');
      expect(queueDecisions).toHaveLength(2);
    });
  });

  describe('Density Threshold', () => {
    it(`should NOT trigger when density is below ${DENSITY_ALERT_THRESHOLD_PERCENT}%`, async () => {
      const snapshot = makeSnapshot(
        [makeZone({ densityPercent: DENSITY_ALERT_THRESHOLD_PERCENT - 1 })],
        [makeQueue({ waitTimeMinutes: 5 })]
      );
      const decisions = await evaluateCrowdDecisions(snapshot);
      const densityDecisions = decisions.filter((d: Decision) => d.type === 'density_alert');
      expect(densityDecisions).toHaveLength(0);
    });

    it(`should trigger when density meets ${DENSITY_ALERT_THRESHOLD_PERCENT}% threshold`, async () => {
      const snapshot = makeSnapshot(
        [makeZone({ densityPercent: DENSITY_ALERT_THRESHOLD_PERCENT, status: 'critical' })],
        [makeQueue({ waitTimeMinutes: 5 })]
      );
      const decisions = await evaluateCrowdDecisions(snapshot);
      const densityDecisions = decisions.filter((d: Decision) => d.type === 'density_alert');
      expect(densityDecisions).toHaveLength(1);
    });
  });

  describe('Human-in-the-loop guarantee', () => {
    it('should always set isHumanApprovalRequired = true', async () => {
      const snapshot = makeSnapshot(
        [makeZone({ densityPercent: 90, status: 'critical' })],
        [makeQueue({ waitTimeMinutes: 25 })]
      );
      const decisions = await evaluateCrowdDecisions(snapshot);
      for (const decision of decisions) {
        expect(decision.isHumanApprovalRequired).toBe(true);
      }
    });

    it('should always include a triggerReason from deterministic rules', async () => {
      const snapshot = makeSnapshot(
        [makeZone({ densityPercent: 90, status: 'critical' })],
        [makeQueue({ waitTimeMinutes: 5 })]
      );
      const decisions = await evaluateCrowdDecisions(snapshot);
      for (const decision of decisions) {
        expect(decision.triggerReason).toBeTruthy();
        expect(typeof decision.triggerReason).toBe('string');
      }
    });
  });

  describe('Clean state — no decisions', () => {
    it('should return empty array when everything is within normal parameters', async () => {
      const snapshot = makeSnapshot(
        [makeZone({ densityPercent: 50, status: 'normal' })],
        [makeQueue({ waitTimeMinutes: 5 })]
      );
      const decisions = await evaluateCrowdDecisions(snapshot);
      expect(decisions).toHaveLength(0);
    });
  });
});
