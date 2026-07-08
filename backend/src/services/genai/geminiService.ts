/**
 * MatchDay Copilot — Gemini GenAI Service
 *
 * SECURITY: This module is server-side ONLY. The API key is loaded from
 * environment variables and never exposed to the frontend.
 *
 * CACHING: Repeated FAQ-style queries are cached in-memory to reduce
 * token spend and latency (configurable TTL).
 *
 * MOCK MODE: Set GENAI_MODE=mock in .env to use stubbed responses
 * without a real API key (useful for development/testing).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { LRUCache } from 'lru-cache';
import { ChatMessage } from '../../types';
import { logger } from '../../utils/logger';

// -------------------------
// Client initialization
// -------------------------

let genAIClient: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'sk-gemini-your-key-here') {
      throw new Error(
        'GEMINI_API_KEY is not set. Set GENAI_MODE=mock to use mock responses.'
      );
    }
    genAIClient = new GoogleGenerativeAI(apiKey);
  }
  return genAIClient;
}

// -------------------------
// In-memory LRU cache
// -------------------------

const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10) * 1000;

const responseCache = new LRUCache<string, string>({
  max: 200,
  ttl: CACHE_TTL_MS,
});

function getCacheKey(systemPrompt: string, messages: ChatMessage[]): string {
  // Cache based on system prompt + last user message (for FAQ-style repeated queries)
  const lastUserMessage = messages.filter((m) => m.role === 'user').at(-1)?.content || '';
  return `${systemPrompt.slice(0, 100)}::${lastUserMessage}`;
}

// -------------------------
// Mock responses (GENAI_MODE=mock)
// -------------------------

const MOCK_RESPONSES: Record<string, string> = {
  fan: `Welcome to MatchDay Copilot! 🏟️ I'm here to help you navigate the stadium, find facilities, and make the most of your matchday experience.

**How can I help you today?** You can ask me things like:
- "Where's the nearest restroom to Gate C?"
- "How do I get to Section 214?"
- "Is it crowded near the north entrance?"
- "What's the wait time at Gate A?"

*Note: This is a demo response. Connect a Gemini API key for real AI responses.*`,

  staff: `**Shift Briefing — Current Status: AMBER ⚠️**

**Priority Concerns:**
1. **North Stand (Gate A)** — 90% capacity, 28-min queue (increasing). Consider deploying 2 additional staff to redirect fans to Gate C.
2. **West Stand (Gate E)** — 80% capacity, 22-min queue. Monitor for overflow.
3. **Main Concourse** — 80% density. Recommend opening secondary food service points.

**Recommended Actions:**
- Deploy crowd management staff to Gate A immediately
- Broadcast PA message directing fans to Gate C or D
- Alert medical team to North Stand status

*Note: These are AI-generated suggestions for human approval only.*`,

  organizer: `**Overall Status: AMBER ⚠️**

Tonight's event is progressing with notable crowd concentration in the North and West stands. Immediate attention recommended at Gate A (28-min queue, trending up).

**Top Concerns:**
1. Gate A queue approaching critical threshold — rerouting needed
2. West Stand density at 80% — pre-emptive staffing suggested
3. Rideshare drop zone (Gate C) congested

**Recommended Actions:**
1. Reroute Gate A overflow to Gate C (announce via PA and app)
2. Open overflow shuttle from North Park & Ride
3. Deploy 3 additional stewards to Gate E

*Note: Demo response — connect Gemini API for live AI analysis.*`,
};

// -------------------------
// Main service functions
// -------------------------

export interface GenAICallOptions {
  systemPrompt: string;
  messages: ChatMessage[];
  persona?: 'fan' | 'staff' | 'organizer';
  useCache?: boolean;
  maxTokens?: number;
}

export interface GenAIResponse {
  content: string;
  cached: boolean;
  model: string;
}

/**
 * Call the GenAI model (or return mock response in mock mode).
 * Implements caching for repeated queries.
 */
export async function callGenAI(options: GenAICallOptions): Promise<GenAIResponse> {
  const {
    systemPrompt,
    messages,
    persona = 'fan',
    useCache = false,
    maxTokens = 1024,
  } = options;

  const isMockMode = process.env.GENAI_MODE === 'mock' || !process.env.GEMINI_API_KEY;

  // Return mock response in mock mode
  if (isMockMode) {
    logger.warn('GenAI running in MOCK mode — set GEMINI_API_KEY for real responses');
    const mockContent = MOCK_RESPONSES[persona] || MOCK_RESPONSES.fan;
    return { content: mockContent, cached: false, model: 'mock' };
  }

  // Check cache for repeated queries
  if (useCache) {
    const cacheKey = getCacheKey(systemPrompt, messages);
    const cached = responseCache.get(cacheKey);
    if (cached) {
      logger.info('GenAI cache hit');
      return { content: cached, cached: true, model: 'cache' };
    }
  }

  // Make real API call
  try {
    const client = getClient();
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    // Format messages for Gemini API (must alternate user/model and start with user)
    const geminiHistory: { role: string; parts: { text: string }[] }[] = [];
    let lastRole = '';

    for (const m of messages.filter((m) => m.role !== 'system')) {
      const role = m.role === 'user' ? 'user' : 'model';
      
      // Gemini requires the first message in the history to be from a user
      if (geminiHistory.length === 0 && role === 'model') continue;
      
      if (role === lastRole) {
        // Collapse consecutive messages from the same role
        geminiHistory[geminiHistory.length - 1].parts[0].text += '\n\n' + m.content;
      } else {
        geminiHistory.push({
          role,
          parts: [{ text: m.content }],
        });
        lastRole = role;
      }
    }

    // In a multi-turn conversation, Gemini expects history + current message.
    // However, if we just pass everything to generateContent, we might need a specific format.
    // The easiest is to use startChat if we have history, or generateContent for single turn.
    
    // We will just stringify the history into the prompt for simplicity here if it's a single call,
    // but using generateContent with a contents array is better.
    const response = await model.generateContent({
      contents: geminiHistory,
      generationConfig: {
        maxOutputTokens: maxTokens,
      }
    });

    const content = response.response.text();

    // Store in cache if enabled
    if (useCache && content) {
      const cacheKey = getCacheKey(systemPrompt, messages);
      responseCache.set(cacheKey, content);
    }

    logger.info(`GenAI call successful`);
    return { content, cached: false, model: 'gemini-2.5-flash' };
  } catch (error) {
    logger.error('GenAI API call failed', error);
    throw new Error(
      `GenAI service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Detect the language of a given text using a lightweight Gemini call.
 * Returns an ISO 639-1 language code (e.g., "en", "es", "fr", "pt", "ar").
 */
export async function detectLanguage(text: string): Promise<string> {
  const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'pt', 'ar'];

  // Quick heuristic checks to avoid an API call for obvious cases
  if (/^[a-zA-Z\s\d.,!?'"-]+$/.test(text) && !text.match(/[àáâãçèéêëìíîïñòóôõùúûü]/i)) {
    return 'en';
  }

  if (process.env.GENAI_MODE === 'mock') {
    return 'en'; // Default to English in mock mode
  }

  try {
    const response = await callGenAI({
      systemPrompt:
        'You are a language detection tool. Respond with ONLY the ISO 639-1 language code (2 letters). Supported: en, es, fr, pt, ar. If unsure or if the language is not supported, respond with "en".',
      messages: [{ role: 'user', content: `Detect the language of: "${text}"` }],
      useCache: true,
      maxTokens: 10,
    });

    const detectedCode = response.content.trim().toLowerCase().slice(0, 2);
    return SUPPORTED_LANGUAGES.includes(detectedCode) ? detectedCode : 'en';
  } catch {
    return 'en'; // Fall back to English if detection fails
  }
}

export { responseCache };
