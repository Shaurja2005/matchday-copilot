/**
 * MatchDay Copilot — Rate Limiting Middleware
 *
 * Protects the GenAI endpoint from abuse and prevents cost overrun.
 */

import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20', 10);

/**
 * Rate limiter for the /api/chat endpoint.
 * More restrictive than general API endpoints since each call incurs LLM cost.
 */
export const chatRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please wait before sending another message.',
    retryAfter: Math.ceil(windowMs / 1000),
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip during testing
});

/**
 * General API rate limiter (more permissive).
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});
