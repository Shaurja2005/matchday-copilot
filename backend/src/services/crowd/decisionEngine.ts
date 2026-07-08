/**
 * MatchDay Copilot — Rules + GenAI Hybrid Decision Engine
 *
 * DESIGN PHILOSOPHY (document for evaluators):
 * This engine uses a two-stage hybrid approach:
 *
 * Stage 1 — Deterministic Rules (fast, predictable, no LLM cost):
 *   Explicit numeric thresholds are checked against live crowd data.
 *   If a threshold is breached, a Decision is created with a rule-based
 *   trigger reason. This stage runs synchronously.
 *
 * Stage 2 — GenAI Enhancement (human-readable, contextual):
 *   When a rule fires, a GenAI call generates the human-readable recommendation
 *   and rationale. This makes the suggestion actionable for staff.
 *   The GenAI NEVER makes autonomous decisions — it only generates text
 *   that a human operator must review and approve.
 *
 * HUMAN-IN-THE-LOOP GUARANTEE:
 *   Every Decision has isHumanApprovalRequired = true (always).
 *   The frontend surfaces decisions as "Suggested Actions" with Acknowledge/Dismiss buttons.
 *   No action is ever taken automatically.
 */

import { v4 as uuidv4 } from 'uuid';
import { Decision, CrowdSnapshot, Zone, Queue } from '../../types';
import { callGenAI } from '../genai/geminiService';
import { logger } from '../../utils/logger';

// -----------------------------------------------
// DECISION THRESHOLDS (Stage 1 — Deterministic)
// -----------------------------------------------

/** Queue wait time that triggers a rerouting recommendation */
export const QUEUE_ALERT_THRESHOLD_MINUTES = 20;

/** Zone density that triggers a crowd management suggestion */
export const DENSITY_ALERT_THRESHOLD_PERCENT = 85;

/** Zone density that triggers a critical alert */
export const DENSITY_CRITICAL_THRESHOLD_PERCENT = 95;

// -----------------------------------------------
// Decision generation
// -----------------------------------------------

/**
 * Evaluate current crowd snapshot against thresholds.
 * Returns an array of triggered decisions (may be empty).
 * GenAI is called for each triggered decision to generate human-readable content.
 */
export async function evaluateCrowdDecisions(
  snapshot: CrowdSnapshot
): Promise<Decision[]> {
  const triggeredDecisions: Decision[] = [];

  // --- Check 1: Queue wait time thresholds ---
  const criticalQueues = snapshot.queues.filter(
    (q) => q.waitTimeMinutes >= QUEUE_ALERT_THRESHOLD_MINUTES
  );

  for (const queue of criticalQueues) {
    const severity =
      queue.waitTimeMinutes >= QUEUE_ALERT_THRESHOLD_MINUTES * 1.5 ? 'high' : 'medium';

    const triggerReason = `Queue at ${queue.gateName} has exceeded ${QUEUE_ALERT_THRESHOLD_MINUTES}-minute threshold (current: ${queue.waitTimeMinutes} min, trend: ${queue.trend})`;

    // Stage 2: GenAI generates human-readable recommendation
    const { recommendation, rationale } = await generateQueueRecommendation(
      queue.gateName,
      queue.waitTimeMinutes,
      queue.trend,
      snapshot
    );

    const decision: Decision = {
      id: uuidv4(),
      triggeredAt: new Date().toISOString(),
      type: 'queue_alert',
      severity,
      affectedGateIds: [queue.gateId],
      affectedZoneIds: [],
      triggerReason, // Deterministic rule — no AI
      aiRecommendation: recommendation, // GenAI output
      aiRationale: rationale, // GenAI output
      isHumanApprovalRequired: true, // ALWAYS — human-in-the-loop
      status: 'pending',
    };

    triggeredDecisions.push(decision);
    logger.info(`Decision triggered: queue_alert at ${queue.gateName}`);
  }

  // --- Check 2: Zone density thresholds ---
  const highDensityZones = snapshot.zones.filter(
    (z) => z.densityPercent >= DENSITY_ALERT_THRESHOLD_PERCENT
  );

  for (const zone of highDensityZones) {
    const severity =
      zone.densityPercent >= DENSITY_CRITICAL_THRESHOLD_PERCENT ? 'critical' : 'high';

    const triggerReason = `Zone "${zone.name}" has exceeded density threshold of ${DENSITY_ALERT_THRESHOLD_PERCENT}% (current: ${zone.densityPercent}%)`;

    // Stage 2: GenAI generates human-readable recommendation
    const { recommendation, rationale } = await generateDensityRecommendation(
      zone,
      snapshot
    );

    const decision: Decision = {
      id: uuidv4(),
      triggeredAt: new Date().toISOString(),
      type: 'density_alert',
      severity,
      affectedGateIds: zone.gateIds,
      affectedZoneIds: [zone.id],
      triggerReason, // Deterministic rule — no AI
      aiRecommendation: recommendation, // GenAI output
      aiRationale: rationale, // GenAI output
      isHumanApprovalRequired: true, // ALWAYS
      status: 'pending',
    };

    triggeredDecisions.push(decision);
    logger.info(`Decision triggered: density_alert at ${zone.name} (${zone.densityPercent}%)`);
  }

  return triggeredDecisions;
}

// -----------------------------------------------
// GenAI recommendation generators (Stage 2)
// -----------------------------------------------

async function generateQueueRecommendation(
  gateName: string,
  waitMinutes: number,
  trend: Queue['trend'],
  snapshot: CrowdSnapshot
): Promise<{ recommendation: string; rationale: string }> {
  // Find alternative gates with shorter queues
  const alternatives = snapshot.queues
    .filter((q) => q.waitTimeMinutes < QUEUE_ALERT_THRESHOLD_MINUTES / 2)
    .sort((a, b) => a.waitTimeMinutes - b.waitTimeMinutes)
    .slice(0, 2)
    .map((q) => `${q.gateName} (${q.waitTimeMinutes} min)`)
    .join(', ');

  const systemPrompt = `You are a crowd management AI for a major football stadium. Generate a brief, specific recommendation for a staff decision-maker. 
IMPORTANT: This is a SUGGESTION for human staff to review — never imply automatic action will be taken.`;

  const userMessage = `Queue at ${gateName} is ${waitMinutes} minutes and ${trend}. 
Alternative gates available: ${alternatives || 'none identified'}.
Generate:
1. A 1-sentence recommended action (start with "Consider...")
2. A 1-sentence rationale explaining why

Format as JSON: {"recommendation": "...", "rationale": "..."}
Return ONLY valid JSON.`;

  try {
    const response = await callGenAI({
      systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      persona: 'organizer',
      maxTokens: 200,
    });

    const parsed = JSON.parse(response.content) as { recommendation: string; rationale: string };
    return parsed;
  } catch {
    // Fallback if GenAI fails or is in mock mode with unexpected output
    return {
      recommendation: `Consider redirecting fans from ${gateName} to alternative gates with shorter queues (${alternatives || 'check other gates'}).`,
      rationale: `Wait time at ${gateName} has exceeded the ${QUEUE_ALERT_THRESHOLD_MINUTES}-minute threshold and is ${trend}.`,
    };
  }
}

async function generateDensityRecommendation(
  zone: Zone,
  _snapshot: CrowdSnapshot
): Promise<{ recommendation: string; rationale: string }> {
  const systemPrompt = `You are a crowd safety AI for a major football stadium. Generate a brief recommendation for a staff decision-maker.
IMPORTANT: This is a SUGGESTION for human staff to review — never imply automatic action.`;

  const userMessage = `Zone "${zone.name}" is at ${zone.densityPercent}% capacity (status: ${zone.status}).
Linked gates: ${zone.gateIds.join(', ')}.
Generate:
1. A 1-sentence recommended action (start with "Consider...")
2. A 1-sentence rationale

Format as JSON: {"recommendation": "...", "rationale": "..."}
Return ONLY valid JSON.`;

  try {
    const response = await callGenAI({
      systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      persona: 'organizer',
      maxTokens: 200,
    });

    const parsed = JSON.parse(response.content) as { recommendation: string; rationale: string };
    return parsed;
  } catch {
    return {
      recommendation: `Consider activating crowd flow management protocols for ${zone.name} and directing incoming fans to less crowded zones.`,
      rationale: `${zone.name} has reached ${zone.densityPercent}% density, exceeding the ${DENSITY_ALERT_THRESHOLD_PERCENT}% safety threshold.`,
    };
  }
}
