/**
 * MatchDay Copilot — Organizer / Control-Room Prompt Templates
 *
 * All system prompts for organizer-persona GenAI calls are defined here as
 * named constants (not inline strings in route handlers). This keeps prompt
 * text auditable, searchable, and easy to update without touching routing logic.
 */

// -----------------------------------------------
// System prompt constants (used by route handlers)
// -----------------------------------------------

/**
 * System prompt for the organizer situation summary endpoint.
 * Sets the AI's role as a professional control-room intelligence system.
 */
export const ORGANIZER_SUMMARY_SYSTEM_PROMPT =
  'You are MatchDay Copilot, a professional stadium operations intelligence system. You provide concise, factual situation summaries for senior venue organizers. All recommendations are for human review only.';

/**
 * System prompt for the organizer natural-language query endpoint.
 * Instructs the AI to ground its answers in provided live data.
 */
export const ORGANIZER_QUERY_SYSTEM_PROMPT =
  'You are MatchDay Copilot, an AI operations assistant. Answer questions by reasoning over the provided live data. Be direct and cite the data that supports your conclusion.';

/**
 * System prompt for the sustainability analysis endpoint.
 * Scopes the AI to carbon-footprint and eco-transport analysis only.
 */
export const ORGANIZER_SUSTAINABILITY_SYSTEM_PROMPT =
  'You are MatchDay Copilot, a sustainability analysis assistant for large events. Focus on transport carbon footprint, practical reduction suggestions, and fan communication strategies.';

import { CrowdSnapshot, TransportRoute } from '../types';

/**
 * Build the organizer situation summary prompt.
 * AI generates a control-room overview from multi-signal data.
 */
export function buildOrganizerSummaryPrompt(
  snapshot: CrowdSnapshot,
  transportData: TransportRoute[],
  weatherNote?: string
): string {
  const zonesSummary = snapshot.zones
    .map((z) => `${z.label}: ${z.densityPercent}% (${z.status})`)
    .join(', ');

  const queuesSummary = snapshot.queues
    .map((q) => `${q.gateName}: ${q.waitTimeMinutes}min (${q.trend})`)
    .join(', ');

  const transportSummary = transportData
    .map((t) => `${t.label}: ${t.etaMinutes}min ETA, crowding=${t.crowdingLevel}`)
    .join('; ');

  const overallDensity = Math.round(
    (snapshot.totalOccupancy / snapshot.totalCapacity) * 100
  );

  return `You are MatchDay Copilot's control-room intelligence system. Generate a comprehensive situation summary for senior venue organizers.

## Live Data Feed (${new Date(snapshot.timestamp).toLocaleTimeString()})

**Overall Occupancy:** ${snapshot.totalOccupancy.toLocaleString()} / ${snapshot.totalCapacity.toLocaleString()} (${overallDensity}%)
**Zone Status:** ${zonesSummary}
**Queue Times:** ${queuesSummary}
**Transport:** ${transportSummary}
${weatherNote ? `**Weather:** ${weatherNote}` : ''}

## Instructions
Generate a situation summary that includes:

1. **Overall Status** (GREEN / AMBER / RED) with a 2-sentence explanation
2. **Top 3 Concerns** that require organizer attention in the next 30 minutes
3. **Recommended Actions** (3-5 specific, actionable items with justification)
4. **Positive Notes** (1-2 things going well to give the team context)
5. **30-Minute Forecast** (what is likely to change based on current trends)

Tone: Professional, concise, factual. This is for senior decision-makers — be direct.
Format: Use clear headings. Keep the entire response under 400 words.
CRITICAL: All recommendations are for human organizers to review and approve — never imply autonomous action.`;
}

/**
 * Build the natural-language query prompt for the organizer query bar.
 * Allows organizers to ask questions like "Which gates need extra staff in 30 min?"
 */
export function buildOrganizerQueryPrompt(
  query: string,
  snapshot: CrowdSnapshot,
  transportData: TransportRoute[]
): string {
  const dataContext = JSON.stringify(
    {
      timestamp: snapshot.timestamp,
      totalOccupancy: snapshot.totalOccupancy,
      totalCapacity: snapshot.totalCapacity,
      zones: snapshot.zones.map((z) => ({
        id: z.id,
        name: z.name,
        densityPercent: z.densityPercent,
        status: z.status,
      })),
      queues: snapshot.queues.map((q) => ({
        gateId: q.gateId,
        gateName: q.gateName,
        waitTimeMinutes: q.waitTimeMinutes,
        trend: q.trend,
      })),
      transport: transportData.map((t) => ({
        type: t.type,
        label: t.label,
        etaMinutes: t.etaMinutes,
        crowdingLevel: t.crowdingLevel,
      })),
    },
    null,
    2
  );

  return `You are MatchDay Copilot's data analysis assistant for venue organizers. 
Answer the following question by reasoning over the provided live stadium data.

## Organizer Query
"${query}"

## Available Data
\`\`\`json
${dataContext}
\`\`\`

## Instructions
- Answer the question directly and specifically — reference actual data from the dataset
- Show your reasoning briefly (1-2 sentences explaining WHY you reached your conclusion)
- If the question requires a recommendation, provide one with justification
- If data is insufficient to answer with confidence, say so and explain what additional data would help
- Keep the response under 150 words
- Format: Direct answer first, then reasoning, then recommendation (if applicable)`;
}

/**
 * Build the sustainability analysis prompt.
 * Estimates carbon footprint and suggests greener transport alternatives.
 */
export function buildSustainabilityPrompt(
  transportData: TransportRoute[],
  estimatedAttendance: number
): string {
  const transportBreakdown = transportData
    .map(
      (t) =>
        `- ${t.type} (${t.label}): ${t.carbonKgPerPerson} kg CO₂/person, crowding: ${t.crowdingLevel}`
    )
    .join('\n');

  return `Analyze the sustainability profile of tonight's event transport data and provide actionable recommendations to reduce the carbon footprint.

## Event Data
Estimated attendance: ${estimatedAttendance.toLocaleString()} fans
Transport options available:
${transportBreakdown}

## Task
1. Estimate the approximate total transport carbon footprint (show calculation reasoning briefly)
2. Identify the 2 most carbon-intensive transport modes currently in use
3. Provide 3 specific, actionable suggestions to shift fans to greener options
4. Suggest any public messaging that could encourage sustainable transport choices tonight

Keep the response concise and data-driven. Format with clear sections.`;
}
