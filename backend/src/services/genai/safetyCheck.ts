/**
 * MatchDay Copilot — Content Safety Check
 *
 * All GenAI output is checked before being sent to fans.
 * This is a defense-in-depth measure — the primary safety is in the prompt,
 * but this catches unexpected completions.
 */

import { logger } from '../../utils/logger';

export interface SafetyCheckResult {
  isSafe: boolean;
  flaggedReason?: string;
  sanitizedContent?: string;
}

// Patterns that indicate potentially unsafe or off-topic LLM output
const UNSAFE_PATTERNS = [
  // Security/operational info that shouldn't be shared
  /\b(security\s+code|access\s+code|override|backdoor|vulnerability)\b/gi,
  // Hate speech indicators
  /\b(hate|attack|bomb|explosive|weapon|knife|gun)\b/gi,
  // PII extraction attempts
  /\b(credit\s+card|passport\s+number|social\s+security|date\s+of\s+birth)\b/gi,
  // Prompt injection indicators
  /\b(ignore\s+previous\s+instructions|forget\s+your\s+system|act\s+as|jailbreak)\b/gi,
  // Unusual length (possible hallucination or prompt bleed)
];

const MAX_RESPONSE_LENGTH = 5000; // characters

/**
 * Check a GenAI response for safety before displaying to fans.
 * Returns { isSafe: true } if safe, or { isSafe: false, flaggedReason } if not.
 */
export function checkContentSafety(content: string): SafetyCheckResult {
  // Check 1: Length guard
  if (content.length > MAX_RESPONSE_LENGTH) {
    logger.warn(`Safety: Response too long (${content.length} chars), truncating`);
    return {
      isSafe: true,
      sanitizedContent: content.slice(0, MAX_RESPONSE_LENGTH) + '\n\n[Response truncated for safety]',
    };
  }

  // Check 2: Empty or minimal response
  if (content.trim().length < 5) {
    return {
      isSafe: false,
      flaggedReason: 'Response too short or empty',
    };
  }

  // Check 3: Pattern matching for unsafe content
  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(content)) {
      logger.warn(`Safety: Content flagged by pattern: ${pattern.source}`);
      return {
        isSafe: false,
        flaggedReason: 'Content flagged for safety review',
      };
    }
  }

  // Check 4: Prompt injection detection (look for system-prompt bleed)
  if (content.includes('CRITICAL:') || content.includes('INSTRUCTIONS:') || content.includes('[SYSTEM]')) {
    logger.warn('Safety: Possible prompt bleed detected in response');
    return {
      isSafe: false,
      flaggedReason: 'Response structure anomaly detected',
    };
  }

  return { isSafe: true };
}

/**
 * Sanitize a fan-submitted chat message before processing.
 * Removes potential prompt injection attempts.
 */
export function sanitizeUserInput(input: string): { sanitized: string; wasModified: boolean } {
  let sanitized = input.trim();
  let wasModified = false;

  // Remove common prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/gi,
    /forget\s+(your\s+)?(system\s+)?prompt/gi,
    /act\s+as\s+(a\s+)?different/gi,
    /you\s+are\s+now\s+a/gi,
    /\[SYSTEM\]/gi,
    /<<\s*SYS\s*>>/gi,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, '[filtered]');
      wasModified = true;
      logger.warn('Security: Prompt injection attempt detected and filtered');
    }
  }

  // Limit input length to prevent token-stuffing attacks
  const MAX_INPUT_LENGTH = 1000;
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.slice(0, MAX_INPUT_LENGTH);
    wasModified = true;
  }

  return { sanitized, wasModified };
}
