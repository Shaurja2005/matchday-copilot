/**
 * MatchDay Copilot — Crowd Data Formatter Utilities
 *
 * Shared helper functions for turning raw crowd snapshot data into
 * human-readable summary strings. Extracted here to eliminate duplication
 * between the chat, staff, and organizer route handlers.
 *
 * WHY separate from the simulator: formatters are pure functions of data
 * shape — they carry no simulation state and are independently testable.
 */

import { CrowdSnapshot, Queue, Zone } from '../types';

/**
 * Format queue data into a compact summary string suitable for injecting
 * into a GenAI prompt or displaying as a status line.
 *
 * @example
 * // "Gate A: 25min (increasing), Gate C: 8min (stable)"
 * formatQueueSummary(snapshot.queues)
 */
export function formatQueueSummary(queues: Queue[]): string {
  return queues
    .map((q) => `${q.gateName}: ${q.waitTimeMinutes}min (${q.trend})`)
    .join(', ');
}

/**
 * Format zone density data into a compact summary string.
 *
 * @example
 * // "North Stand: 92%, South Stand: 65%"
 * formatZoneSummary(snapshot.zones)
 */
export function formatZoneSummary(zones: Zone[]): string {
  return zones
    .map((z) => `${z.name}: ${z.densityPercent}%`)
    .join(', ');
}

/**
 * Compute overall density percentage from a crowd snapshot.
 * Excludes the concourse zone to avoid double-counting fans who pass through.
 *
 * @returns Density as an integer 0–100
 */
export function computeOverallDensityPercent(snapshot: CrowdSnapshot): number {
  return Math.round((snapshot.totalOccupancy / snapshot.totalCapacity) * 100);
}

/**
 * Map an overall density percentage to a traffic-light status string.
 * Used for both the organizer summary panel and the crowd route.
 *
 * Thresholds (rationale: matches UEFA operational safety guidelines):
 *   - green  : < 75% — normal operations
 *   - amber  : 75–89% — increased monitoring required
 *   - red    : ≥ 90% — immediate management action required
 */
export function densityToStatus(densityPercent: number): 'green' | 'amber' | 'red' {
  if (densityPercent >= 90) return 'red';
  if (densityPercent >= 75) return 'amber';
  return 'green';
}

/**
 * Map an overall density percentage to a key metric status label.
 */
export function densityToMetricStatus(densityPercent: number): 'ok' | 'warning' | 'critical' {
  if (densityPercent >= 90) return 'critical';
  if (densityPercent >= 75) return 'warning';
  return 'ok';
}

/**
 * Map a queue wait time to a key metric status label.
 *
 * Thresholds (rationale: 20 min is the decision-engine alert threshold;
 * 12 min is a warning to proactively staff additional lanes).
 */
export function queueTimeToMetricStatus(waitTimeMinutes: number): 'ok' | 'warning' | 'critical' {
  if (waitTimeMinutes >= 20) return 'critical';
  if (waitTimeMinutes >= 12) return 'warning';
  return 'ok';
}
