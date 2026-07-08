/**
 * MatchDay Copilot — Incident Triage Prompt Templates
 *
 * DESIGN CHOICE: All AI suggestions for incidents are ALWAYS presented as
 * recommendations for human staff to approve and act upon. The system never
 * autonomously takes action. This is a core human-in-the-loop design requirement.
 */

import { Incident } from '../types';

/**
 * Build the incident triage prompt.
 * Returns AI severity classification + recommended next step.
 */
export function buildIncidentTriagePrompt(
  incidentDescription: string,
  gateLabel?: string,
  zoneLabel?: string
): string {
  const locationContext =
    gateLabel || zoneLabel
      ? `Location context: ${[gateLabel, zoneLabel].filter(Boolean).join(', ')}`
      : 'Location: not specified';

  return `You are MatchDay Copilot's incident triage assistant for a major international football venue. 
A staff member has reported an incident that requires classification and a recommended response.

IMPORTANT: You are providing RECOMMENDATIONS ONLY. A human staff member will review and decide whether to act on your suggestion. Do not imply that any action will be taken automatically.

## Incident Report
${incidentDescription}

## ${locationContext}

## Your Task
Provide a structured incident assessment with:

1. **Severity Classification**: LOW / MEDIUM / HIGH / CRITICAL
   - LOW: Minor inconvenience, fan comfort issue
   - MEDIUM: Potential crowd management issue, needs monitoring
   - HIGH: Safety concern requiring immediate attention
   - CRITICAL: Life safety emergency — all hands respond

2. **Triage Summary**: 1-2 sentences explaining your severity reasoning

3. **Recommended Next Step**: The single most important immediate action a staff member should consider taking (start with "Consider...")

4. **Escalation Trigger**: At what point should this be escalated to a supervisor? (e.g., "If not resolved within 5 minutes...")

Format your response as JSON with keys: severity, triageSummary, recommendedNextStep, escalationTrigger
Respond with ONLY valid JSON, no markdown fences.`;
}

/**
 * Build a batch triage prompt for reviewing multiple open incidents.
 */
export function buildBatchTriagePrompt(incidents: Partial<Incident>[]): string {
  const incidentList = incidents
    .map(
      (inc, i) =>
        `${i + 1}. [${inc.severity?.toUpperCase() || 'UNCLASSIFIED'}] ${inc.description} (${inc.gateId || inc.zoneId || 'unknown location'})`
    )
    .join('\n');

  return `Review the following open incidents at the stadium and provide a priority ranking and brief note on which need immediate attention.

## Open Incidents
${incidentList}

Provide:
1. Prioritized list (most urgent first) with a 1-sentence rationale
2. Any incidents that appear related and should be handled together
3. Overall incident load assessment: MANAGEABLE / ELEVATED / OVERWHELMING

IMPORTANT: These are recommendations for human staff to review. Format as a structured plain-text response.`;
}
