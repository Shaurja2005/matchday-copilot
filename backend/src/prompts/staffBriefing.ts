/**
 * MatchDay Copilot — Staff Briefing & Quick-Reply Prompt Templates
 */

import { CrowdSnapshot, Hotspot } from '../types';

/**
 * Generate a shift briefing prompt from the current crowd snapshot.
 * Output: plain-language summary of hotspots + recommended actions.
 */
export function buildShiftBriefingPrompt(snapshot: CrowdSnapshot): string {
  const hotspots = snapshot.zones
    .filter((z) => z.status === 'critical' || z.status === 'busy')
    .map((z) => `- ${z.label}: ${z.densityPercent}% capacity (${z.status.toUpperCase()})`)
    .join('\n');

  const queues = snapshot.queues
    .filter((q) => q.waitTimeMinutes > 10)
    .map((q) => `- ${q.gateName}: ${q.waitTimeMinutes} min wait (${q.trend})`)
    .join('\n');

  return `You are MatchDay Copilot's staff operations advisor. Generate a concise, professional shift briefing for venue staff based on the following live data.

## Current Stadium Status (${new Date(snapshot.timestamp).toLocaleTimeString()})

### Zone Crowd Levels (Concerns Only)
${hotspots || 'All zones within normal parameters.'}

### Gate Queue Times (>10 min only)
${queues || 'All queues within acceptable range.'}

### Total Occupancy
${snapshot.totalOccupancy.toLocaleString()} / ${snapshot.totalCapacity.toLocaleString()} (${Math.round((snapshot.totalOccupancy / snapshot.totalCapacity) * 100)}%)

---

Generate a shift briefing that includes:
1. A 2-3 sentence overall status summary (green/amber/red framing)
2. Top 3 priority hotspots with specific recommended staff actions
3. Any pro-active staffing suggestions (e.g., "position 2 additional staff at Gate A to direct fans to Gate C")
4. A brief fan communication recommendation (what message to broadcast/post)

Keep the tone professional and action-oriented. Write in plain English. Format with clear headings.
IMPORTANT: Always frame recommendations as suggestions for human staff to decide upon — never as autonomous actions.`;
}

/**
 * Generate a quick-reply draft for staff responding to a fan query.
 * Staff types in English; AI responds in the fan's language.
 */
export function buildQuickReplyPrompt(
  staffNote: string,
  targetLanguage: string,
  fanOriginalMessage: string
): string {
  const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    pt: 'Portuguese',
    ar: 'Arabic',
  };

  const langName = languageNames[targetLanguage] || 'English';

  return `You are MatchDay Copilot's staff communication assistant. A venue staff member has written a note about how to respond to a fan, and you need to turn it into a polished, friendly reply in the fan's language.

## Fan's Original Message
"${fanOriginalMessage}"

## Staff Note (in English)
"${staffNote}"

## Instructions
1. Write a friendly, helpful reply to the fan based on the staff note
2. The reply MUST be written entirely in ${langName} (language code: ${targetLanguage})
3. Keep the tone warm and reassuring — the fan may be stressed or confused
4. Keep the reply under 100 words
5. Do NOT translate the staff note literally — craft a natural, human-sounding reply
6. If the staff note is unclear or incomplete, fill in sensible details from the context

Return ONLY the reply text in ${langName}, nothing else.`;
}

/**
 * Hotspot analysis prompt for determining staffing recommendations.
 */
export function buildHotspotAnalysisPrompt(hotspots: Hotspot[]): string {
  const hotspotList = hotspots
    .map((h) => `- ${h.zoneName} (${h.densityPercent}% full): ${h.reason}`)
    .join('\n');

  return `Analyze the following stadium hotspots and provide specific, actionable staffing recommendations. 
Each recommendation must be a concrete action a volunteer or security officer can take RIGHT NOW.

## Current Hotspots
${hotspotList}

Provide:
- 3-5 immediate recommended actions
- Priority order (most urgent first)
- Any fan communication talking points

Format as a numbered list. Keep each action under 30 words. 
IMPORTANT: These are suggestions for human approval — clearly note this.`;
}
